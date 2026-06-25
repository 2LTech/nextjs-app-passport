// Secure
export const SECURE_COOKIE =
  process.env.NODE_ENV === 'production'
    ? !process.env.NEXTJS_APP_PASSPORT_UNSECURE
    : false

// Token secret
// Minimum secret length (characters). @hapi/iron's default algorithm
// (aes-256-cbc) requires a 256-bit / 32-character password, so a shorter
// secret only fails later, per request, from deep inside Iron.
export const TOKEN_SECRET_MIN_LENGTH = 32

// Validate the secret at module load so a missing or too-short
// NEXTJS_APP_PASSPORT_TOKEN fails fast with a clear configuration error
// instead of surfacing as an opaque, swallowed runtime failure.
const tokenSecret = process.env.NEXTJS_APP_PASSPORT_TOKEN
if (!tokenSecret || tokenSecret.length < TOKEN_SECRET_MIN_LENGTH) {
  throw new Error(
    `NEXTJS_APP_PASSPORT_TOKEN must be set and at least ${TOKEN_SECRET_MIN_LENGTH} characters long`
  )
}
export const TOKEN_SECRET = tokenSecret

// Token name
export const TOKEN_NAME = 'nextjs-app-passport-token'

// Cookie max age
export const MAX_AGE = 60 * 60 * 8 // 8 hours

// Errors
export const errors = {
  tokenNotFound: 'Token not found',
  sessionExpired: 'Session expired',
  refreshFailed: 'Failed to refresh session',
  invalidAuthentication: 'Invalid username or password',
  invalidLogin: 'Invalid username and password combination'
}
