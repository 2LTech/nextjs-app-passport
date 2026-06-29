import { NextRequest } from 'next/server'

import { buildCustomStrategy, strategyName } from '@/lib/strategy'

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
})
