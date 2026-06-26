import { NextRequest } from 'next/server'

import { isSameOrigin, guardStateChange } from '@/lib/security'
import { errors } from '@/defs'

/**
 * Build a minimal NextRequest-like object.
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

describe('@/lib/security', () => {
  describe('isSameOrigin - Fetch Metadata', () => {
    test('same-origin is allowed', () => {
      expect(
        isSameOrigin(makeReq('POST', { 'sec-fetch-site': 'same-origin' }))
      ).toBe(true)
    })

    test('same-site cross-origin is rejected (not trusted on its own)', () => {
      expect(
        isSameOrigin(
          makeReq('POST', {
            'sec-fetch-site': 'same-site',
            origin: 'https://evil.example.com',
            host: 'app.example.com'
          })
        )
      ).toBe(false)
    })

    test('same-site falls through to an Origin/Host match', () => {
      expect(
        isSameOrigin(
          makeReq('POST', {
            'sec-fetch-site': 'same-site',
            origin: 'https://app.example.com',
            host: 'app.example.com'
          })
        )
      ).toBe(true)
    })

    test('unknown Fetch Metadata value requires an Origin/Host match', () => {
      expect(
        isSameOrigin(
          makeReq('POST', {
            'sec-fetch-site': 'future-value',
            origin: 'https://evil.example.com',
            host: 'app.example.com'
          })
        )
      ).toBe(false)
    })

    test('none (direct user action) is allowed', () => {
      expect(isSameOrigin(makeReq('POST', { 'sec-fetch-site': 'none' }))).toBe(
        true
      )
    })

    test('cross-site is rejected', () => {
      expect(
        isSameOrigin(makeReq('POST', { 'sec-fetch-site': 'cross-site' }))
      ).toBe(false)
    })
  })

  describe('isSameOrigin - Origin/Host fallback', () => {
    test('no Fetch Metadata and no Origin fails open', () => {
      expect(isSameOrigin(makeReq('POST'))).toBe(true)
    })

    test('matching Origin and Host is allowed', () => {
      expect(
        isSameOrigin(
          makeReq('POST', {
            origin: 'https://app.example.com',
            host: 'app.example.com'
          })
        )
      ).toBe(true)
    })

    test('matching Origin and X-Forwarded-Host is allowed', () => {
      expect(
        isSameOrigin(
          makeReq('POST', {
            origin: 'https://app.example.com',
            host: 'internal:3000',
            'x-forwarded-host': 'app.example.com'
          })
        )
      ).toBe(true)
    })

    test('mismatched Origin and Host is rejected', () => {
      expect(
        isSameOrigin(
          makeReq('POST', {
            origin: 'https://evil.example.com',
            host: 'app.example.com'
          })
        )
      ).toBe(false)
    })

    test('Origin without any Host is rejected', () => {
      expect(
        isSameOrigin(makeReq('POST', { origin: 'https://app.example.com' }))
      ).toBe(false)
    })

    test('malformed Origin is rejected', () => {
      expect(
        isSameOrigin(
          makeReq('POST', { origin: 'not a url', host: 'app.example.com' })
        )
      ).toBe(false)
    })
  })

  describe('guardStateChange', () => {
    test('allows a same-origin POST', () => {
      expect(
        guardStateChange(makeReq('POST', { 'sec-fetch-site': 'same-origin' }))
      ).toBeNull()
    })

    test('rejects non-POST with 405 and Allow header', async () => {
      const res = guardStateChange(makeReq('GET'))
      expect(res).not.toBeNull()
      expect(res!.status).toBe(405)
      expect(res!.headers.get('Allow')).toBe('POST')

      const data = await res!.json()
      expect(data.ok).toBe(false)
      expect(data.err).toBe(errors.methodNotAllowed)
    })

    test('rejects a cross-site POST with 403', async () => {
      const res = guardStateChange(
        makeReq('POST', { 'sec-fetch-site': 'cross-site' })
      )
      expect(res).not.toBeNull()
      expect(res!.status).toBe(403)

      const data = await res!.json()
      expect(data.ok).toBe(false)
      expect(data.err).toBe(errors.invalidOrigin)
    })

    test('rejects a same-site cross-origin POST with 403', async () => {
      const res = guardStateChange(
        makeReq('POST', {
          'sec-fetch-site': 'same-site',
          origin: 'https://evil.example.com',
          host: 'app.example.com'
        })
      )
      expect(res).not.toBeNull()
      expect(res!.status).toBe(403)

      const data = await res!.json()
      expect(data.ok).toBe(false)
      expect(data.err).toBe(errors.invalidOrigin)
    })
  })
})
