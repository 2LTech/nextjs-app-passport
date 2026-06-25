import {
  ABSOLUTE_MAX_AGE,
  errors,
  MAX_AGE,
  SECURE_COOKIE,
  TOKEN_NAME
} from '@/defs'

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

  test('ABSOLUTE_MAX_AGE', () => {
    expect(ABSOLUTE_MAX_AGE).toBeDefined()
    // The absolute ceiling must allow at least one full sliding window
    expect(ABSOLUTE_MAX_AGE).toBeGreaterThanOrEqual(MAX_AGE)
  })

  test('errors', () => {
    expect(errors).toBeDefined()
  })
})
