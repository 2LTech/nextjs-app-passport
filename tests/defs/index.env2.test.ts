describe('@/defs', () => {
  test('TOKEN_SECRET & SECURE_COOKIE', async () => {
    process.env.NEXTJS_APP_PASSPORT_TOKEN = 'token'
    process.env.NODE_ENV = 'production'
    process.env.NEXTJS_APP_PASSPORT_UNSECURE = 'true'
    const defs = await import('@/defs')
    expect(defs.TOKEN_SECRET).toBe('token')
    expect(defs.SECURE_COOKIE).toBe(false)
  })
})
