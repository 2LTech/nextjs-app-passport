// Secure
export const SECURE_COOKIE =
  process.env.NODE_ENV === 'production'
    ? !process.env.NEXTJS_APP_PASSPORT_UNSECURE
    : false

// Token secret
export const TOKEN_SECRET = process.env.NEXTJS_APP_PASSPORT_TOKEN!

// Token name
export const TOKEN_NAME = 'nextjs-app-passport-token'

// Cookie max age
export const MAX_AGE = 60 * 60 * 8 // 8 hours

// Erorrs
export const errors = {
  tokenNotFound: 'Token not found',
  sessionExpired: 'Session expired',
  refreshFailed: 'Failed to refresh session',
  invalidAuthentication: 'Invalid username or password',
  invalidLogin: 'Invalid username and password combination'
}
