[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=2LTech_nextjs-app-passport&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=2LTech_nextjs-app-passport)

# nextjs-app-passport

**[NextJS](https://nextjs.org/) authentication using local [passport](https://www.passportjs.org/)**

## Demo

You can see an example in [nextjs-app-passport-demo](https://github.com/2LTech/nextjs-app-passport-demo)

## Environment variables

### `NEXTJS_APP_PASSPORT_TOKEN` (mandatory)

Used to encrypt the cookie, minimum 32 characters length.

### `NEXTJS_APP_PASSPORT_UNSECURE` (optional)

If defined, allow usage of cookie over HTTP connexion.

## `setLocalStrategy`

You have to define your own `findUser` and `validatePassword` function to set passport strategy.

Type:

```typescript
type setLocaLStrategy = async (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => void
```

Usage:

```typescript
setLocaLStrategy(findUser, validatePassword)
```

Typically used in the API login route to initialize passport.

### `findUser`

Type:

```typescript
type FindUser = (body: any) => Promise<{ user?: any }>
```

This function should find an user from request body content (see `APILoginRoute`) and return it, or nothing if no user is found.

### `validatePassord`

Type:

```typescript
type ValidatePassword = (user: any, body: any) => boolean
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
type getSession = async () => Session
```

Usage in `app/api/[getSessionRouteName]/route.[js|ts]`:

```typescript
export const GET = async () => {
  try {
    const session = await getSession()
    // Be carfeul! The entire user object is returned
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
