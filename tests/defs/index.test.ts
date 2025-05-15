import { errors, MAX_AGE, SECURE_COOKIE, TOKEN_NAME } from '@/defs'

describe('@/defs', () => {
  test('SECURE_COOKIE', () => {
    expect(SECURE_COOKIE).toBe(false)
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
