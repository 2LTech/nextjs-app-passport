import {
  buildLocalStrategy,
  hasLocalStrategy,
  setLocalStrategy,
  STRATEGY_NAME
} from '@/lib/strategy'
import { NextRequest } from 'next/server'
import passport from 'passport'

jest.mock('@/defs', () => ({
  errors: {
    invalidLogin: 'invalid login'
  }
}))

const authenticate = (req: NextRequest): Promise<any> =>
  new Promise((resolve, reject) => {
    passport.authenticate(
      STRATEGY_NAME,
      { session: false },
      (err: Error, user: any) => {
        if (err) reject(err)
        else resolve(user)
      }
    )(req)
  })

const mockFindUser = jest.fn()
const findUser = async (res: any) => mockFindUser(res)

const mockValidatePassword = jest.fn()
const validatePassword = (user: any, res: any) =>
  mockValidatePassword(user, res)

const mockJson = jest.fn()
const req = {
  json: async () => mockJson()
} as NextRequest

describe('@/lib/strategy', () => {
  beforeEach(() => {
    mockFindUser.mockReset()
    mockFindUser.mockImplementation(() => ({ id: 'id' }))
    mockValidatePassword.mockReset()
    mockValidatePassword.mockImplementation(() => true)
    mockJson.mockReset()
    mockJson.mockImplementation(() => ({
      username: 'username',
      password: 'password'
    }))
  })

  test('success', async () => {
    setLocalStrategy(findUser, validatePassword)
    const user = await authenticate(req)
    expect(mockFindUser).toHaveBeenCalledTimes(1)
    expect(mockFindUser).toHaveBeenCalledWith({
      username: 'username',
      password: 'password'
    })
    expect(mockValidatePassword).toHaveBeenCalledTimes(1)
    expect(mockValidatePassword).toHaveBeenCalledWith(
      { id: 'id' },
      {
        username: 'username',
        password: 'password'
      }
    )
    expect(user).toEqual({ id: 'id' })
  })

  test('wrong password', async () => {
    mockValidatePassword.mockImplementation(() => false)
    try {
      await authenticate(req)
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('invalid login')
    }
  })

  test('findUser error', async () => {
    mockFindUser.mockImplementation(() => {
      throw new Error('find user error')
    })
    try {
      await authenticate(req)
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('find user error')
    }
  })

  test('json error', async () => {
    mockJson.mockImplementation(() => {
      throw new Error('json error')
    })
    try {
      await authenticate(req)
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('json error')
    }
  })

  test('STRATEGY_NAME', () => {
    expect(STRATEGY_NAME).toBe('next-app-passport')
  })

  test('buildLocalStrategy returns a fresh, isolated strategy', () => {
    const a = buildLocalStrategy(findUser, validatePassword)
    const b = buildLocalStrategy(findUser, validatePassword)
    // Each call is a distinct instance, so it can be registered per request
    // without sharing global state.
    expect(a).not.toBe(b)
    expect(typeof a.authenticate).toBe('function')
  })

  test('hasLocalStrategy reflects global registration', () => {
    // Registered
    setLocalStrategy(findUser, validatePassword)
    expect(hasLocalStrategy()).toBe(true)

    // Not registered (registry present, slot empty)
    passport.unuse(STRATEGY_NAME)
    expect(hasLocalStrategy()).toBe(false)

    // Defensive: passport without the internal `_strategy` lookup
    const registry = passport as unknown as { _strategy?: unknown }
    const original = registry._strategy
    delete registry._strategy
    expect(hasLocalStrategy()).toBe(false)
    registry._strategy = original
  })
})
