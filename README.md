[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=2LTech_nextjs-app-passport&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=2LTech_nextjs-app-passport)

# nextjs-app-passport

**[NextJS](https://nextjs.org/) authentication using local [passport](https://www.passportjs.org/)**

## Demo

You can see an example in [nextjs-app-passport-demo](https://github.com/2LTech/nextjs-app-passport-demo)

## Environment variables

### `NEXTJS_APP_PASSPORT_TOKEN` (mandatory)

Used to encrypt the cookie, minimum 32 characters length. This is enforced at
startup: the module throws on import if the variable is missing or shorter than
32 characters.

### `NEXTJS_APP_PASSPORT_UNSECURE` (optional)

If defined, allow usage of cookie over HTTP connection. Only intended for local
development; leaving it set in production disables the `Secure` cookie flag.

## `setLocalStrategy`

You have to define your own `findUser` and `validatePassword` function to set passport strategy.

Type:

```typescript
type setLocalStrategy = <TUser extends { id: string } = { id: string }>(
  findUser: (body: unknown) => Promise<TUser | null | undefined>,
  validatePassword: (user: TUser, body: unknown) => boolean
) => void
```

`setLocalStrategy` is generic over your own user type `TUser`. The request `body` is typed `unknown` so you must narrow/validate it before use, and the `TUser` you return from `findUser` flows into `validatePassword`.

`TUser` is constrained to `{ id: string }`: the user resolved by `findUser` is stored verbatim in the session, and every session exposes a string `id` (see `Session` below), so the stored user must carry one. The same fields can later be retrieved with `getSession<TUser>()`.

Usage:

```typescript
interface User {
  id: string
  username: string
}

// TUser is inferred as `User` from the callbacks, or set it explicitly.
setLocalStrategy<User>(findUser, validatePassword)
```

Typically used in the API login route to initialize passport.

### `findUser`

Type:

```typescript
type FindUser<TUser extends { id: string } = { id: string }> = (
  body: unknown
) => Promise<TUser | null | undefined>
```

This function should find an user from request body content (see `APILoginRoute`) and return it, or `null`/`undefined` if no user is found.

### `validatePassword`

Type:

```typescript
type ValidatePassword<TUser extends { id: string } = { id: string }> = (
  user: TUser,
  body: unknown
) => boolean
```

This function should validate the password using the user data (for example hash, salt, ...).

## `APILoginRoute`

Type:

```typescript
type APILoginRoute = async (req: NextRequest) => Response
```

Usage in `app/api/[loginRouteName]/route.[js|ts]`:

```typescript
export const POST = APILoginRoute
```

> `APILoginRoute` get the body content directly from your fetch request in the client side.

## `APILogoutRoute`

Type:

```typescript
type APILogoutRoute = async () => Response
```

Usage in `app/api/[logoutRouteName]/route.[js|ts]`:

```typescript
export const GET = APILogoutRoute
```

## `APIRefreshSessionRoute`

Type:

```typescript
type APIRefreshSessionRoute = async () => Response
```

Usage in `app/api/[refreshSessionRouteName]/route.[js|ts]`:

```typescript
export const GET = APIRefreshSessionRoute
```

## `getSession`

Type:

```typescript
type getSession = <TUser = unknown>() => Promise<
  {
    id: string
    [key: string]: unknown
  } & TUser
>
```

Pass your own user type to get a strongly typed session, e.g.
`const session = await getSession<User>()`. With the default `TUser = unknown`,
unknown keys are typed `unknown`, so you must pass a type (or narrow) before
reading them.

> :information_source: `TUser` is a **caller-provided assertion** of the extra
> fields stored alongside the base session — it is not validated at runtime.
> Make sure the object you persist through `setLocalStrategy`/login actually
> matches the type you assert here.

Usage in `app/api/[getSessionRouteName]/route.[js|ts]`:

```typescript
interface User {
  id: string
  username: string
}

export const GET = async () => {
  try {
    // Pass your user type so `session.username` is typed instead of `unknown`.
    const session = await getSession<User>()
    // Be careful! The entire user object is returned
    // Filter session to not send hash, salt, ...
    return Response.json({
      ok: true,
      data: {
        id: session.id,
        username: session.username
      }
    })
  } catch (err) {
    console.error(err)
    return Response.json({ ok: false, err: err.message })
  }
}
```

> :warning: Be careful that `getSession` return the entire `user` object that can contain some sensitive informations as hash or salt for example.

## Security considerations

### Stateless sessions: logout cannot revoke server-side

Sessions are fully stateless: the encrypted [iron](https://hapi.dev/module/iron/)
cookie is the only source of truth and there is no server-side session store or
denylist. `APILogoutRoute` only deletes the client cookie — it does **not**
invalidate the token server-side. As a consequence, a cookie value that was
captured before logout stays valid until it expires (and `APIRefreshSessionRoute`
can extend it up to the absolute lifetime).

If you need to revoke sessions on the server (for example on "log out
everywhere" or on credential change), add your own mechanism, such as a
token-id denylist or a per-user `tokenVersion` claim that you check inside your
`getSession` wrapper.

Two lifetimes bound every session: a sliding `MAX_AGE` (8 hours, refreshed on
each `APIRefreshSessionRoute` call) and an absolute lifetime (7 days) that
refresh cannot extend.

### `GET` for logout / refresh

`APILogoutRoute` and `APIRefreshSessionRoute` are documented as `GET` handlers
even though they mutate state (clearing/rotating the cookie). This keeps usage
simple — they can be triggered by a plain navigation or `<img>`/`fetch` GET —
but it means they are not protected by the browser's method-based CSRF
expectations. If CSRF is a concern for your application, expose them as `POST`
routes instead (the handlers themselves are method-agnostic) and/or require the
session `csrfToken` rotated by `APIRefreshSessionRoute`.
