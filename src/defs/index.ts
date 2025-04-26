// Token secret
export const TOKEN_SECRET = process.env.TOKEN_SECRET!

// Token name
export const TOKEN_NAME = 'node-app-passport-token'

// Cookie max age
export const MAX_AGE = 60 * 60 * 8 // 8 hours

// Erorrs
export const errors = {
  tokenNotFound: 'Token not found',
  sessionExpired: 'Session expired',
  refreshFailed: 'Failed to refresh session',
  invalidAuthentication: 'Invalid username or password'
}
