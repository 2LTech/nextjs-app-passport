import { NextRequest } from 'next/server'

import login from '@/lib/login'

const mockInitialize = jest.fn()
const mockAuthentication = jest.fn()
jest.mock('passport', () => ({
  initialize: () => mockInitialize(),
  authenticate: (_strategy: string, _options: any, callback: Function) =>
    mockAuthentication(callback)
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

  beforeEach(() => {
    mockInitialize.mockReset()
    mockAuthentication.mockReset()
    mockAuthentication.mockImplementation((callback: Function) => () => {
      callback(null, { id: 'id' })
    })
    mockSetSession.mockReset()
  })

  test('login', async () => {
    await login(req)
    expect(mockInitialize).toHaveBeenCalledTimes(1)
    expect(mockAuthentication).toHaveBeenCalledTimes(1)
    expect(mockSetSession).toHaveBeenCalledTimes(1)
    expect(mockSetSession).toHaveBeenCalledWith({ id: 'id' })
  })

  test('empty user', async () => {
    mockAuthentication.mockImplementation((callback: Function) => () => {
      callback(null, false)
    })
    try {
      await login(req)
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('invalidAuthentication')
    }
    expect(mockInitialize).toHaveBeenCalledTimes(1)
    expect(mockAuthentication).toHaveBeenCalledTimes(1)
    expect(mockSetSession).toHaveBeenCalledTimes(0)
  })

  test('error', async () => {
    mockAuthentication.mockImplementation((callback: Function) => () => {
      callback(new Error('authenticate error'), false)
    })
    try {
      await login(req)
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('authenticate error')
    }
    expect(mockInitialize).toHaveBeenCalledTimes(1)
    expect(mockAuthentication).toHaveBeenCalledTimes(1)
    expect(mockSetSession).toHaveBeenCalledTimes(0)
  })
})
