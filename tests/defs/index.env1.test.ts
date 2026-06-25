describe('@/defs', () => {
  test('TOKEN_SECRET & SECURE_COOKIE', async () => {
    const secret = 'production-secret-32-chars-min!!'
    process.env.NEXTJS_APP_PASSPORT_TOKEN = secret
    process.env.NODE_ENV = 'production'
    const defs = await import('@/defs')
    expect(defs.TOKEN_SECRET).toBe(secret)
    expect(defs.SECURE_COOKIE).toBe(true)
  })
})
