import {
  errors,
  MAX_AGE,
  SECURE_COOKIE,
  TOKEN_NAME,
  TOKEN_SECRET_MIN_LENGTH
} from '@/defs'

describe('@/defs', () => {
  const originalToken = process.env.NEXTJS_APP_PASSPORT_TOKEN

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    if (originalToken) process.env.NEXTJS_APP_PASSPORT_TOKEN = originalToken
    else delete process.env.NEXTJS_APP_PASSPORT_TOKEN
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

  test('SECURE_COOKIE', () => {
    expect(SECURE_COOKIE).toBe(false)
  })

  test('SECURE_COOKIE', async () => {
    process.env.NODE_ENV = 'production'
    expect((await import('@/defs')).SECURE_COOKIE).toBe(true)
  })

  test('TOKEN_NAME', () => {
    expect(TOKEN_NAME).toBeDefined()
  })

  test('MAX_AGE', () => {
    expect(MAX_AGE).toBeDefined()
  })

  test('errors', () => {
    expect(errors).toBeDefined()
  })
})
