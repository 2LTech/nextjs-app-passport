import { NextRequest } from 'next/server'

import createLogin from '@/lib/login'

const mockAuthenticate = jest.fn()
const mockUse = jest.fn()
jest.mock('passport', () => {
  const authenticate = (...args: any[]) => mockAuthenticate(...args)
  function Passport() {
    return { use: mockUse, authenticate }
  }
  return { __esModule: true, default: { Passport } }
})

const mockHasLocalStrategy = jest.fn()
const mockBuildLocalStrategy = jest.fn()
jest.mock('@/lib/strategy', () => ({
  strategyName: 'nextjs-app-passport',
  buildCustomStrategy: (findUser: any, validatePassword: any) =>
    mockBuildLocalStrategy(findUser, validatePassword)
}))

jest.mock('@/defs', () => ({
  errors: {
    invalidAuthentication: 'invalidAuthentication'
  }
}))

const mockSetSession = jest.fn()
jest.mock('@/lib/session', () => ({
  setSession: async (session: any) => mockSetSession(session)
}))

describe('@/lib/login', () => {
  const req = {} as NextRequest
  const findUser = jest.fn()
  const validatePassword = jest.fn()

  beforeEach(() => {
    mockAuthenticate.mockReset()
    mockAuthenticate.mockImplementation(
      (_strategy: string, _options: any, callback: Function) => () =>
        callback(null, { id: 'id' })
    )
    mockUse.mockReset()
    mockHasLocalStrategy.mockReset()
    mockHasLocalStrategy.mockImplementation(() => true)
    mockSetSession.mockReset()
  })

  test('createLogin', async () => {
    await createLogin(findUser, validatePassword)(req)
    expect(mockBuildLocalStrategy).toHaveBeenCalledTimes(1)
    expect(mockUse).toHaveBeenCalledTimes(1)
    expect(mockAuthenticate).toHaveBeenCalledTimes(1)
    expect(mockSetSession).toHaveBeenCalledTimes(1)
    expect(mockSetSession).toHaveBeenCalledWith({ id: 'id' })
  })

  test('empty user', async () => {
    mockAuthenticate.mockImplementation(
      (_strategy: string, _options: any, callback: Function) => () =>
        callback(null, false)
    )
    try {
      await createLogin(findUser, validatePassword)(req)
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('invalidAuthentication')
    }
    expect(mockSetSession).toHaveBeenCalledTimes(0)
  })

  test('authenticate error', async () => {
    mockAuthenticate.mockImplementation(
      (_strategy: string, _options: any, callback: Function) => () =>
        callback(new Error('authenticate error'), false)
    )
    try {
      await createLogin(findUser, validatePassword)(req)
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('authenticate error')
    }
    expect(mockSetSession).toHaveBeenCalledTimes(0)
  })
})
