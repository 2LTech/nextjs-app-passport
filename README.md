[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=2LTech_nextjs-app-passport&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=2LTech_nextjs-app-passport)

# nextjs-app-passport

**[NextJS](https://nextjs.org/) authentication using local [passport](https://www.passportjs.org/)**

## Demo

You can see an example in [nextjs-app-passport-demo](https://github.com/2LTech/nextjs-app-passport-demo)

## Environment variables

### `NEXTJS_APP_PASSPORT_TOKEN` (mandatory)

Used to encrypt the cookie, minimum `TOKEN_SECRET_MIN_LENGTH` (default 32) characters length. This is enforced at
startup: the module throws on import if the variable is missing or shorter than
`TOKEN_SECRET_MIN_LENGTH` characters.

### `NEXTJS_APP_PASSPORT_UNSECURE` (optional)

If defined, allow usage of cookie over HTTP connection. Only intended for local
development; leaving it set in production disables the `Secure` cookie flag.

### `findUser`

Type:

```typescript
export type MinimalSession = { id: string }
export type FindUser<User extends MinimalSession> = (
  body: unknown
) => Promise<User | null | undefined>
```

This function should find an user from request body content (see `APILoginRoute`) and return it, or `null | undefined` if no user is found.

### `validatePassword`

Type:

```typescript
export type MinimalSession = { id: string }
export type ValidatePassword<User extends MinimalSession> = (
  user: User,
  body: unknown
) => boolean
```

This function should validate the password using the user data (for example hash, salt, ...).

## `APICreateLoginRoute`

It returns a login route handler bound to your `findUser`/`validatePassword`. Each request builds an isolated per-request passport instance, so registration is intrinsic to the route.

Type:

```typescript
export declare const APICreateLoginRoute: <User extends MinimalSession>(
  findUser: FindUser<User>,
  validatePassword: ValidatePassword<User>
) => Promise<Response>
```

Usage in `app/api/[loginRouteName]/route.[js|ts]`:

```typescript
export const POST = APICreateLoginRoute(findUser, validatePassword)
```

## `APILogoutRoute`

Type:

```typescript
export declare const APILogoutRoute: () => Promise<Response>
```

Usage in `app/api/[logoutRouteName]/route.[js|ts]`:

```typescript
export const POST = APILogoutRoute
```

## `APIRefreshSessionRoute`

Type:

```typescript
export declare const APIRefreshSessionRoute: () => Promise<Response>
```

Usage in `app/api/[refreshSessionRouteName]/route.[js|ts]`:

```typescript
export const POST = APIRefreshSessionRoute
```

## `getSession`

Type:

```typescript
export interface Session {
  id: string
  [key: string]: unknown
}
export declare const getSession: (additionalData?: string[]) => Promise<Session>
```

Usage in `app/api/[getSessionRouteName]/route.[js|ts]`:

Default returned values in Session are `id`, `createdAt` and `issuedAt`, you can return more data using `additionalData`.

```typescript
export const POST = async () => {
  try {
    const session = await getSession(['username'])
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
