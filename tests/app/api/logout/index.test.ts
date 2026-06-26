import { NextRequest } from 'next/server'

import { logoutRoute } from '@/app/api/logout'

import { internalErrorMessage } from '@/lib/api/response'

const mockRemoveCookie = jest.fn()
jest.mock('@/lib/session', () => ({
  removeCookie: async () => mockRemoveCookie()
}))

const mockGuard = jest.fn()
jest.mock('@/lib/api/security', () => ({
  guard: () => mockGuard()
}))

describe('@/app/api/logout', () => {
  const req = {} as NextRequest
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    mockRemoveCookie.mockReset()
    mockGuard.mockReset()
    mockGuard.mockImplementation(() => null)

    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('logoutRoute', async () => {
    const res = await logoutRoute(req)
    expect(res.status).toBe(200)
    expect(mockRemoveCookie).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('security', async () => {
    mockGuard.mockImplementation(() =>
      Response.json({ ok: false }, { status: 403 })
    )
    const res = await logoutRoute(req)
    expect(res.status).toBe(403)

    const data = await res.json()
    expect(data.ok).toBe(false)
  })

  test('unknown internal error, 500', async () => {
    const rawMessage = 'some internal server error'
    mockRemoveCookie.mockImplementation(() => {
      throw new Error(rawMessage)
    })
    const res = await logoutRoute(req)
    expect(res.status).toBe(500)
    expect(mockRemoveCookie).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(internalErrorMessage)
    expect(consoleError).toHaveBeenCalledWith(new Error(rawMessage))
  })
})
