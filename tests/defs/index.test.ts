import {
  errors,
  MAX_AGE,
  ABSOLUTE_MAX_AGE,
  SECURE_COOKIE,
  TOKEN_NAME,
  TOKEN_SECRET,
  TOKEN_SECRET_MIN_LENGTH
} from '@/defs'

describe('@/defs', () => {
  // Snapshot the env keys these tests mutate so each case is isolated and the
  // process is restored afterwards (env leaks across files in the same worker).
  const originalToken = process.env.NEXTJS_APP_PASSPORT_TOKEN
  const originalNodeEnv = process.env.NODE_ENV
  const originalUnsecure = process.env.NEXTJS_APP_PASSPORT_UNSECURE

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    if (originalToken !== undefined)
      process.env.NEXTJS_APP_PASSPORT_TOKEN = originalToken
    else delete process.env.NEXTJS_APP_PASSPORT_TOKEN

    if (originalNodeEnv !== undefined) process.env.NODE_ENV = originalNodeEnv
    else delete process.env.NODE_ENV

    if (originalUnsecure !== undefined)
      process.env.NEXTJS_APP_PASSPORT_UNSECURE = originalUnsecure
    else delete process.env.NEXTJS_APP_PASSPORT_UNSECURE
  })

  test('NEXTJS_APP_PASSPORT_TOKEN not set', async () => {
    delete process.env.NEXTJS_APP_PASSPORT_TOKEN
    await expect(import('@/defs')).rejects.toThrow(
      `NEXTJS_APP_PASSPORT_TOKEN must be set and at least ${TOKEN_SECRET_MIN_LENGTH} characters long`
    )
  })

  test('NEXTJS_APP_PASSPORT_TOKEN too small', async () => {
    process.env.NEXTJS_APP_PASSPORT_TOKEN = 'a'.repeat(
      TOKEN_SECRET_MIN_LENGTH - 1
    )
    await expect(import('@/defs')).rejects.toThrow(
      `NEXTJS_APP_PASSPORT_TOKEN must be set and at least ${TOKEN_SECRET_MIN_LENGTH} characters long`
    )
  })

  test('TOKEN_SECRET takes its value from the env when valid (>= min length)', async () => {
    const secret = 'b'.repeat(TOKEN_SECRET_MIN_LENGTH)
    process.env.NEXTJS_APP_PASSPORT_TOKEN = secret
    const defs = await import('@/defs')
    expect(defs.TOKEN_SECRET).toBe(secret)
    // Exactly the minimum length must be accepted (boundary).
    expect(defs.TOKEN_SECRET.length).toBe(TOKEN_SECRET_MIN_LENGTH)
  })

  test('TOKEN_SECRET_MIN_LENGTH', () => {
    expect(TOKEN_SECRET_MIN_LENGTH).toBe(32)
  })

  test('TOKEN_SECRET (bootstrap value)', () => {
    expect(TOKEN_SECRET).toBe(process.env.NEXTJS_APP_PASSPORT_TOKEN)
  })

  test('SECURE_COOKIE is false outside production', () => {
    expect(SECURE_COOKIE).toBe(false)
  })

  test('SECURE_COOKIE is true in production (unless explicitly unsecured)', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXTJS_APP_PASSPORT_UNSECURE
    expect((await import('@/defs')).SECURE_COOKIE).toBe(true)
  })

  test('SECURE_COOKIE is false in production when NEXTJS_APP_PASSPORT_UNSECURE is set', async () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXTJS_APP_PASSPORT_UNSECURE = '1'
    expect((await import('@/defs')).SECURE_COOKIE).toBe(false)
  })

  test('TOKEN_NAME', () => {
    expect(TOKEN_NAME).toBe('nextjs-app-passport-token')
  })

  test('MAX_AGE is 8 hours (seconds)', () => {
    expect(MAX_AGE).toBe(60 * 60 * 8)
  })

  test('ABSOLUTE_MAX_AGE is 7 days (seconds) and exceeds MAX_AGE', () => {
    expect(ABSOLUTE_MAX_AGE).toBe(60 * 60 * 24 * 7)
    expect(ABSOLUTE_MAX_AGE).toBeGreaterThan(MAX_AGE)
  })

  test('errors expose the documented messages', () => {
    expect(errors).toEqual({
      tokenNotFound: 'Token not found',
      sessionExpired: 'Session expired',
      refreshFailed: 'Failed to refresh session',
      invalidAuthentication: 'Invalid username or password',
      invalidLogin: 'Invalid username and password combination'
    })
  })
})
