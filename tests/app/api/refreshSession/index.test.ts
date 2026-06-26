import { NextRequest } from 'next/server'

import { refreshSessionRoute } from '@/app/api/refreshSession'

import { errors } from '@/defs'

import { internalErrorMessage } from '@/lib/api/response'

const mockRefreshSession = jest.fn()
jest.mock('@/lib/session', () => ({
  refreshSession: async () => mockRefreshSession()
}))

const mockGuard = jest.fn()
jest.mock('@/lib/api/security', () => ({
  guard: () => mockGuard()
}))

describe('@/app/api/refresh', () => {
  const req = {} as NextRequest
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    mockRefreshSession.mockReset()
    mockGuard.mockReset()

    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('refreshRoute', async () => {
    const res = await refreshSessionRoute(req)
    expect(res.status).toBe(200)
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('guard', async () => {
    mockGuard.mockImplementation(() =>
      Response.json({ ok: false }, { status: 403 })
    )
    const res = await refreshSessionRoute(req)
    expect(res.status).toBe(403)

    const data = await res.json()
    expect(data.ok).toBe(false)
  })

  test('expired/missing session, 401', async () => {
    mockRefreshSession.mockImplementation(() => {
      throw new Error(errors.sessionExpired)
    })
    const res = await refreshSessionRoute(req)
    expect(res.status).toBe(401)
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.sessionExpired)
  })

  test('refresh failure, 500', async () => {
    mockRefreshSession.mockImplementation(() => {
      throw new Error(errors.refreshFailed)
    })
    const res = await refreshSessionRoute(req)
    expect(res.status).toBe(500)
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.refreshFailed)
  })

  test('unknown internal error, 500', async () => {
    const rawMessage = 'some internal server error'
    mockRefreshSession.mockImplementation(() => {
      throw new Error(rawMessage)
    })
    const res = await refreshSessionRoute(req)
    expect(res.status).toBe(500)
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(internalErrorMessage)
    expect(consoleError).toHaveBeenCalledWith(new Error(rawMessage))
  })
})
