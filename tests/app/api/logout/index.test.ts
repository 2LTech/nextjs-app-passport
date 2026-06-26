import { NextRequest } from 'next/server'

import { logoutRoute } from '@/app/api/logout'
import { errors } from '@/defs'

const mockRemoveCookie = jest.fn()
jest.mock('@/lib/session', () => ({
  removeCookie: async () => mockRemoveCookie()
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

describe('@/app/api/logout', () => {
  beforeEach(() => {
    mockRemoveCookie.mockReset()
  })

  test('logoutRoute - same-origin POST', async () => {
    const res = await logoutRoute(
      makeReq('POST', { 'sec-fetch-site': 'same-origin' })
    )
    expect(mockRemoveCookie).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('rejects non-POST methods with 405', async () => {
    const res = await logoutRoute(makeReq('GET'))
    expect(res.status).toBe(405)
    expect(res.headers.get('Allow')).toBe('POST')
    expect(mockRemoveCookie).not.toHaveBeenCalled()

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.methodNotAllowed)
  })

  test('rejects cross-site POST with 403', async () => {
    const res = await logoutRoute(
      makeReq('POST', { 'sec-fetch-site': 'cross-site' })
    )
    expect(res.status).toBe(403)
    expect(mockRemoveCookie).not.toHaveBeenCalled()

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.invalidOrigin)
  })

  test('rejects same-site cross-origin POST before removing the cookie', async () => {
    const res = await logoutRoute(
      makeReq('POST', {
        'sec-fetch-site': 'same-site',
        origin: 'https://evil.example.com',
        host: 'app.example.com'
      })
    )
    expect(res.status).toBe(403)
    expect(mockRemoveCookie).not.toHaveBeenCalled()

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.invalidOrigin)
  })

  test('error', async () => {
    const error = 'logout error'
    mockRemoveCookie.mockImplementation(() => {
      throw new Error(error)
    })
    const res = await logoutRoute(
      makeReq('POST', { 'sec-fetch-site': 'same-origin' })
    )
    expect(mockRemoveCookie).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(error)
  })
})
