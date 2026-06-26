import { refreshSessionRoute } from '@/app/api/refreshSession'

import { errors } from '@/defs'
import { internalErrorMessage } from '@/lib/response'

const mockRefreshSession = jest.fn()
jest.mock('@/lib/session', () => ({
  refreshSession: async () => mockRefreshSession()
}))

describe('@/app/api/refresh', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    mockRefreshSession.mockReset()
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('refreshRoute', async () => {
    const res = await refreshSessionRoute()
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('expired/missing session -> 401', async () => {
    mockRefreshSession.mockImplementation(() => {
      throw new Error(errors.sessionExpired)
    })
    const res = await refreshSessionRoute()
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(401)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.sessionExpired)
  })

  test('refresh failure -> 500', async () => {
    mockRefreshSession.mockImplementation(() => {
      throw new Error(errors.refreshFailed)
    })
    const res = await refreshSessionRoute()
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.refreshFailed)
  })

  test('unknown internal failure -> 500 without leaking raw message', async () => {
    const rawMessage = 'internal cookie store detail'
    mockRefreshSession.mockImplementation(() => {
      throw new Error(rawMessage)
    })
    const res = await refreshSessionRoute()
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).not.toBe(rawMessage)
    expect(data.err).toBe(internalErrorMessage)
  })
})
