describe('@/defs NEXTJS_APP_PASSPORT_TOKEN validation', () => {
  const originalToken = process.env.NEXTJS_APP_PASSPORT_TOKEN

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    if (originalToken === undefined)
      delete process.env.NEXTJS_APP_PASSPORT_TOKEN
    else process.env.NEXTJS_APP_PASSPORT_TOKEN = originalToken
  })

  test('throws when the secret is missing', async () => {
    delete process.env.NEXTJS_APP_PASSPORT_TOKEN
    await expect(import('@/defs')).rejects.toThrow(
      'NEXTJS_APP_PASSPORT_TOKEN must be set and at least 32 characters long'
    )
  })

  test('throws when the secret is shorter than 32 characters', async () => {
    process.env.NEXTJS_APP_PASSPORT_TOKEN = 'a'.repeat(31)
    await expect(import('@/defs')).rejects.toThrow(
      'NEXTJS_APP_PASSPORT_TOKEN must be set and at least 32 characters long'
    )
  })

  test('accepts a secret of exactly 32 characters', async () => {
    const secret = 'a'.repeat(32)
    process.env.NEXTJS_APP_PASSPORT_TOKEN = secret
    const defs = await import('@/defs')
    expect(defs.TOKEN_SECRET).toBe(secret)
    expect(defs.TOKEN_SECRET_MIN_LENGTH).toBe(32)
  })
})
