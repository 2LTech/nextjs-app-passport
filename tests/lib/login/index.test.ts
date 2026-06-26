import { NextRequest } from 'next/server'

import login, { createLogin } from '@/lib/login'

// Shared passport mock: a global `authenticate` plus a `Passport` constructor
// that returns a per-request instance exposing `use` + `authenticate`.
const mockAuthenticate = jest.fn()
const mockUse = jest.fn()
jest.mock('passport', () => {
  const authenticate = (...args: any[]) => mockAuthenticate(...args)
  function Passport() {
    return { use: mockUse, authenticate }
  }
  return { __esModule: true, default: { authenticate, Passport } }
})

const mockHasLocalStrategy = jest.fn()
const mockBuildLocalStrategy = jest.fn()
jest.mock('@/lib/strategy', () => ({
  STRATEGY_NAME: 'next-app-passport',
  hasLocalStrategy: () => mockHasLocalStrategy(),
  buildLocalStrategy: (findUser: any, validatePassword: any) =>
    mockBuildLocalStrategy(findUser, validatePassword)
}))

jest.mock('@/defs', () => ({
  errors: {
    invalidAuthentication: 'invalidAuthentication',
    strategyNotRegistered: 'strategyNotRegistered'
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
    // Default: middleware invokes the verify callback with a user.
    mockAuthenticate.mockImplementation(
      (_strategy: string, _options: any, callback: Function) => () =>
        callback(null, { id: 'id' })
    )
    mockUse.mockReset()
    mockHasLocalStrategy.mockReset()
    mockHasLocalStrategy.mockImplementation(() => true)
    mockBuildLocalStrategy.mockReset()
    mockBuildLocalStrategy.mockImplementation(() => 'builtStrategy')
    mockSetSession.mockReset()
  })

  describe('createLogin (per-request instance)', () => {
    test('success', async () => {
      await createLogin(findUser, validatePassword)(req)

      expect(mockBuildLocalStrategy).toHaveBeenCalledWith(
        findUser,
        validatePassword
      )
      expect(mockUse).toHaveBeenCalledWith('next-app-passport', 'builtStrategy')
      expect(mockAuthenticate).toHaveBeenCalledTimes(1)
      expect(mockSetSession).toHaveBeenCalledWith({ id: 'id' })
      // Per-request path never consults the global singleton.
      expect(mockHasLocalStrategy).not.toHaveBeenCalled()
    })

    test('empty user', async () => {
      mockAuthenticate.mockImplementation(
        (_strategy: string, _options: any, callback: Function) => () =>
          callback(null, false)
      )
      await expect(
        createLogin(findUser, validatePassword)(req)
      ).rejects.toThrow('invalidAuthentication')
      expect(mockSetSession).toHaveBeenCalledTimes(0)
    })

    test('authenticate error', async () => {
      mockAuthenticate.mockImplementation(
        (_strategy: string, _options: any, callback: Function) => () =>
          callback(new Error('authenticate error'), false)
      )
      await expect(
        createLogin(findUser, validatePassword)(req)
      ).rejects.toThrow('authenticate error')
      expect(mockSetSession).toHaveBeenCalledTimes(0)
    })
  })

  describe('login (legacy global singleton)', () => {
    test('success', async () => {
      await login(req)

      expect(mockHasLocalStrategy).toHaveBeenCalledTimes(1)
      expect(mockAuthenticate).toHaveBeenCalledTimes(1)
      expect(mockSetSession).toHaveBeenCalledWith({ id: 'id' })
      // Legacy path uses the global instance, not a per-request one.
      expect(mockUse).not.toHaveBeenCalled()
    })

    // Catches the AIR-201 registration bug the previous suite could not: the
    // old tests always registered immediately before authenticating, so a route
    // mounted without setLocalStrategy went unnoticed. Here login must fail fast.
    test('strategy not registered', async () => {
      mockHasLocalStrategy.mockImplementation(() => false)
      await expect(login(req)).rejects.toThrow('strategyNotRegistered')
      expect(mockAuthenticate).toHaveBeenCalledTimes(0)
      expect(mockSetSession).toHaveBeenCalledTimes(0)
    })

    test('empty user', async () => {
      mockAuthenticate.mockImplementation(
        (_strategy: string, _options: any, callback: Function) => () =>
          callback(null, false)
      )
      await expect(login(req)).rejects.toThrow('invalidAuthentication')
      expect(mockSetSession).toHaveBeenCalledTimes(0)
    })
  })

  describe('authenticate res/next invariant', () => {
    test('defensive next(err) rejects', async () => {
      mockAuthenticate.mockImplementation(
        () => (_req: unknown, _res: unknown, next: (err?: any) => void) =>
          next(new Error('next error'))
      )
      await expect(
        createLogin(findUser, validatePassword)(req)
      ).rejects.toThrow('next error')
      expect(mockSetSession).toHaveBeenCalledTimes(0)
    })

    test('defensive next() without error rejects as invalid authentication', async () => {
      mockAuthenticate.mockImplementation(
        () => (_req: unknown, _res: unknown, next: (err?: any) => void) =>
          next()
      )
      await expect(
        createLogin(findUser, validatePassword)(req)
      ).rejects.toThrow('invalidAuthentication')
      expect(mockSetSession).toHaveBeenCalledTimes(0)
    })

    test('settles only once when callback and next both fire', async () => {
      mockAuthenticate.mockImplementation(
        (_strategy: string, _options: any, callback: Function) =>
          (_req: unknown, _res: unknown, next: (err?: any) => void) => {
            callback(null, { id: 'id' })
            // Late, post-resolution next(err) must be ignored by the guard.
            next(new Error('late error'))
          }
      )
      await createLogin(findUser, validatePassword)(req)
      expect(mockSetSession).toHaveBeenCalledTimes(1)
      expect(mockSetSession).toHaveBeenCalledWith({ id: 'id' })
    })
  })
})
