import { NextRequest } from 'next/server'

import { refreshSessionRoute } from '@/app/api/refreshSession'
import { errors } from '@/defs'

const mockRefreshSession = jest.fn()
jest.mock('@/lib/session', () => ({
  refreshSession: async () => mockRefreshSession()
}))

/**
 * Build a minimal NextRequest-like object for the route guard.
 * @param method HTTP method
 * @param headers Lower-cased header map
 */
const makeReq = (
  method: string,
  headers: Record<string, string> = {}
): NextRequest =>
  ({
    method,
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null }
  }) as unknown as NextRequest

describe('@/app/api/refresh', () => {
  beforeEach(() => {
    mockRefreshSession.mockReset()
  })

  test('refreshRoute - same-origin POST', async () => {
    const res = await refreshSessionRoute(
      makeReq('POST', { 'sec-fetch-site': 'same-origin' })
    )
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('rejects non-POST methods with 405', async () => {
    const res = await refreshSessionRoute(makeReq('GET'))
    expect(res.status).toBe(405)
    expect(res.headers.get('Allow')).toBe('POST')
    expect(mockRefreshSession).not.toHaveBeenCalled()

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.methodNotAllowed)
  })

  test('rejects cross-site POST with 403', async () => {
    const res = await refreshSessionRoute(
      makeReq('POST', { 'sec-fetch-site': 'cross-site' })
    )
    expect(res.status).toBe(403)
    expect(mockRefreshSession).not.toHaveBeenCalled()

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.invalidOrigin)
  })

  test('rejects same-site cross-origin POST before refreshing the session', async () => {
    const res = await refreshSessionRoute(
      makeReq('POST', {
        'sec-fetch-site': 'same-site',
        origin: 'https://evil.example.com',
        host: 'app.example.com'
      })
    )
    expect(res.status).toBe(403)
    expect(mockRefreshSession).not.toHaveBeenCalled()

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.invalidOrigin)
  })

  test('error', async () => {
    const error = 'refresh error'
    mockRefreshSession.mockImplementation(() => {
      throw new Error(error)
    })
    const res = await refreshSessionRoute(
      makeReq('POST', { 'sec-fetch-site': 'same-origin' })
    )
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(error)
  })
})
