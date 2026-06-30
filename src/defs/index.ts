// Secure
export const SECURE_COOKIE =
  process.env.NODE_ENV === 'production'
    ? !process.env.NEXTJS_APP_PASSPORT_UNSECURE
    : false

// Token secret
export const TOKEN_SECRET_MIN_LENGTH = 32
const TMP_TOKEN_SECRET = process.env.NEXTJS_APP_PASSPORT_TOKEN
if (!TMP_TOKEN_SECRET || TMP_TOKEN_SECRET.length < TOKEN_SECRET_MIN_LENGTH) {
  throw new Error(
    `NEXTJS_APP_PASSPORT_TOKEN must be set and at least ${TOKEN_SECRET_MIN_LENGTH} characters long`
  )
}
export const TOKEN_SECRET = TMP_TOKEN_SECRET

// Token name
export const TOKEN_NAME = 'nextjs-app-passport-token'

// Cookie max age
export const MAX_AGE = 60 * 60 * 8 // 8 hours

// Absolute session lifetime
export const ABSOLUTE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// Errors
export const errors = {
  tokenNotFound: 'Token not found',
  sessionExpired: 'Session expired',
  refreshFailed: 'Failed to refresh session',
  invalidAuthentication: 'Invalid username or password',
  invalidLogin: 'Invalid username and password combination',
  methodNotAllowed: 'Method not allowed',
  invalidOrigin: 'Cross-site request rejected',
  invalidSession: 'Invalid session'
}
