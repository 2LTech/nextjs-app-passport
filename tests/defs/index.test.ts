import { errors, MAX_AGE, TOKEN_NAME } from '@/defs'

describe('@/defs', () => {
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
