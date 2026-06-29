import { NextRequest } from 'next/server'

import {
  buildCustomStrategy,
  strategyName,
  defaultSerializeUser,
  SENSITIVE_FIELDS
} from '@/lib/strategy'

jest.mock('@/defs', () => ({
  errors: {
    invalidLogin: 'invalid login'
  }
}))

const mockFindUser = jest.fn()
const findUser = async (res: any) => mockFindUser(res)

const mockValidatePassword = jest.fn()
const validatePassword = (user: any, res: any) =>
  mockValidatePassword(user, res)

const mockJson = jest.fn()
const req = {
  json: async () => mockJson()
} as NextRequest

jest.mock('passport-custom', () => ({
  Strategy: (authenticate: any) => {
    return { authenticate }
  }
}))

// Run the (mocked) strategy verify and resolve with what it forwards to `done`.
const runStrategy = (strategy: any): Promise<{ err: any; user: any }> =>
  new Promise((resolve) => {
    strategy.authenticate(req, (err: any, user: any) => resolve({ err, user }))
  })

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

  test('strategyName', () => {
    expect(strategyName).toBe('nextjs-app-passport')
  })

  test('buildCustomStrategy', () => {
    const strategy = buildCustomStrategy(findUser, validatePassword)
    strategy.authenticate(req, jest.fn)
  })

  test('buildCustomStrategy, false', () => {
    mockValidatePassword.mockImplementation(() => false)
    const strategy = buildCustomStrategy(findUser, validatePassword)
    strategy.authenticate(req, jest.fn)
  })

  test('buildCustomStrategy, error', () => {
    mockValidatePassword.mockImplementation(() => {
      throw new Error('validate password error')
    })
    const strategy = buildCustomStrategy(findUser, validatePassword)
    strategy.authenticate(req, jest.fn)
  })

  test('buildCustomStrategy, json error', () => {
    mockJson.mockImplementation(() => {
      throw new Error('json error')
    })
    const strategy = buildCustomStrategy(findUser, validatePassword)
    strategy.authenticate(req, jest.fn)
  })

  test('buildCustomStrategy returns a fresh, isolated strategy', () => {
    const a = buildCustomStrategy(findUser, validatePassword)
    const b = buildCustomStrategy(findUser, validatePassword)
    expect(a).not.toBe(b)
    expect(typeof a.authenticate).toBe('function')
  })

  test('strips sensitive fields by default', async () => {
    mockFindUser.mockImplementation(() => ({
      id: 'id',
      username: 'username',
      password: 'plain',
      hash: 'hash',
      salt: 'salt',
      password_hash: 'ph',
      passwordSalt: 'ps'
    }))
    const { err, user } = await runStrategy(
      buildCustomStrategy(findUser, validatePassword)
    )
    expect(err).toBeNull()
    // validatePassword still receives the full user (it needs the credentials)
    expect(mockValidatePassword).toHaveBeenCalledWith(
      expect.objectContaining({ hash: 'hash', salt: 'salt' }),
      { username: 'username', password: 'password' }
    )
    // but only the sanitized projection is forwarded to login/setSession
    expect(user).toEqual({ id: 'id', username: 'username' })
  })

  test('honors a custom serializeUser', async () => {
    mockFindUser.mockImplementation(() => ({
      id: 'id',
      username: 'username',
      role: 'admin',
      hash: 'hash'
    }))
    const { user } = await runStrategy(
      buildCustomStrategy(findUser, validatePassword, (u: any) => ({
        id: u.id
      }))
    )
    expect(user).toEqual({ id: 'id' })
  })
})

describe('defaultSerializeUser', () => {
  test('drops well-known credential fields (case/separator-insensitive)', () => {
    const safe = defaultSerializeUser({
      id: 'id',
      username: 'username',
      role: 'admin',
      password: 'plain',
      Hash: 'hash',
      SALT: 'salt',
      password_hash: 'ph',
      'password-salt': 'ps',
      hashedPassword: 'hp',
      secret: 's'
    })
    expect(safe).toEqual({ id: 'id', username: 'username', role: 'admin' })
  })

  test('keeps the cited hash/salt fields out of the projection', () => {
    expect(SENSITIVE_FIELDS).toEqual(
      expect.arrayContaining(['hash', 'salt', 'password'])
    )
  })

  test('returns non-object values unchanged', () => {
    expect(defaultSerializeUser(null)).toBe(null)
    expect(defaultSerializeUser(undefined)).toBe(undefined)
    expect(defaultSerializeUser('id')).toBe('id')
  })

  test('does not mutate the source user', () => {
    const user = { id: 'id', hash: 'hash' }
    const safe = defaultSerializeUser(user)
    expect(user).toEqual({ id: 'id', hash: 'hash' })
    expect(safe).toEqual({ id: 'id' })
  })
})
