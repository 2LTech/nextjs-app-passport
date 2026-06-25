// Secure
export const SECURE_COOKIE =
  process.env.NODE_ENV === 'production'
    ? !process.env.NEXTJS_APP_PASSPORT_UNSECURE
    : false

// Token secret
export const TOKEN_SECRET = process.env.NEXTJS_APP_PASSPORT_TOKEN!

// Token name
export const TOKEN_NAME = 'nextjs-app-passport-token'

// Cookie max age (seconds) — the per-token sliding window. Each refresh
// re-issues a token whose validity slides forward by this amount.
export const MAX_AGE = 60 * 60 * 8 // 8 hours

// Absolute session lifetime (seconds) — the hard ceiling measured from the
// initial login (`issuedAt`). Refresh slides the MAX_AGE window but can never
// move past this anchor, so an expired-but-decryptable cookie can no longer be
// refreshed indefinitely. Must be >= MAX_AGE to allow at least one window.
export const ABSOLUTE_MAX_AGE = 60 * 60 * 24 // 24 hours

// Errors
export const errors = {
  tokenNotFound: 'Token not found',
  sessionExpired: 'Session expired',
  refreshFailed: 'Failed to refresh session',
  invalidAuthentication: 'Invalid username or password',
  invalidLogin: 'Invalid username and password combination'
}
