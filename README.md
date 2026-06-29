[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=2LTech_nextjs-app-passport&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=2LTech_nextjs-app-passport)

# nextjs-app-passport

**[NextJS](https://nextjs.org/) authentication using local [passport](https://www.passportjs.org/)**

## Demo

You can see an example in [nextjs-app-passport-demo](https://github.com/2LTech/nextjs-app-passport-demo)

## Environment variables

### `NEXTJS_APP_PASSPORT_TOKEN` (mandatory)

Used to encrypt the cookie, minimum 32 characters length.

### `NEXTJS_APP_PASSPORT_UNSECURE` (optional)

If defined, allow usage of cookie over HTTP connection.

### `findUser`

Type:

```typescript
type FindUser = (body: any) => Promise<any>
```

This function should find an user from request body content (see `APILoginRoute`) and return it, or nothing if no user is found.

### `validatePassword`

Type:

```typescript
type ValidatePassword = (user: any, body: any) => boolean
```

This function should validate the password using the user data (for example hash, salt, ...).

### `serializeUser` (optional)

Type:

```typescript
type SerializeUser = (user: any) => any
```

Optional third argument of `APICreateLoginRoute`. It projects the authenticated
user to the object that is sealed into the session cookie (and later returned by
`getSession`). It runs **after** `validatePassword`, so the full user (with
`hash`, `salt`, ...) is still available for validation, but only its return value
is persisted.

If you do not provide one, a safe-by-default serializer is used. It shallow-copies
the user while stripping well-known **top-level** credential fields (`password`,
`hash`, `salt`, `passwordHash`, `passwordSalt`, `secret`, ... — case- and
separator-insensitive), keeping those columns out of the cookie.

This default is a deny-list, so it does **not** cover nested objects or sensitive
data stored under other field names (e.g. `passwordDigest`, `apiKey`,
`{ credentials: { hash } }`). For a strong guarantee, pass an explicit allow-list
serializer that keeps only the claims your app needs:

```typescript
export const POST = APICreateLoginRoute(findUser, validatePassword, (user) => ({
  id: user.id,
  username: user.username
}))
```

You can also compose the default serializer (exported as `defaultSerializeUser`):

```typescript
import { defaultSerializeUser } from '@2ltech/nextjs-app-passport'

export const POST = APICreateLoginRoute(findUser, validatePassword, (user) => ({
  ...defaultSerializeUser(user),
  role: user.role
}))
```

## `APICreateLoginRoute`

It returns a login route handler bound to your `findUser`/`validatePassword`. Each request builds an isolated per-request passport instance, so registration is intrinsic to the route.

Type:

```typescript
type APICreateLoginRoute = (
  findUser: (body: any) => Promise<any>,
  validatePassword: (user: any, body: any) => boolean,
  serializeUser?: (user: any) => any
) => (req: NextRequest) => Promise<Response>
```

Usage in `app/api/[loginRouteName]/route.[js|ts]`:

```typescript
export const POST = APICreateLoginRoute(findUser, validatePassword)
```

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
type getSession = async () => {
  id: string
  [key: string]: any
}
```

Usage in `app/api/[getSessionRouteName]/route.[js|ts]`:

```typescript
export const GET = async () => {
  try {
    const session = await getSession()
    // session only contains what serializeUser kept (credential fields such as
    // hash/salt are stripped by default), but still return an explicit
    // allow-list to be safe.
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

> :warning: `getSession` returns whatever `serializeUser` persisted at login. The
> default serializer strips well-known top-level credential fields (`hash`,
> `salt`, `password`, ...), but if your user object stores sensitive data under
> custom field names or nested objects, pass an explicit allow-list
> `serializeUser` to `APICreateLoginRoute` and still project the response to the
> fields the client needs.
