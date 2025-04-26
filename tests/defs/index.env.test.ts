describe('@/defs', () => {
  test('TOKEN_SECRET', async () => {
    process.env.TOKEN_SECRET = 'token'
    const defs = await import('@/defs')
    expect(defs.TOKEN_SECRET).toBe('token')
  })
})
