/**
 * Integration tests for the session layer.
 *
 * Unlike `index.test.ts`, these tests use the REAL `@hapi/iron` and the REAL
 * `@/defs` (the test bootstrap pins a valid 32-char `NEXTJS_APP_PASSPORT_TOKEN`
 * in `.config/jest.setupe.js`). Only `next/headers` is mocked, with an
 * in-memory cookie jar, so the genuine seal -> unseal round-trip, the secret,
 * and the CSRF/createdAt fields injected by `refreshSession` are all exercised.
 */
import Iron from '@hapi/iron'

import { getSession, refreshSession, setSession } from '@/lib/session'
import { MAX_AGE, TOKEN_NAME } from '@/defs'

// In-memory cookie jar backing the mocked Next.js cookie store
const jar: Record<string, string> = {}
const mockSet = jest.fn((name: string, value: string) => {
  jar[name] = value
})
const mockGet = jest.fn((name: string) =>
  name in jar ? { value: jar[name] } : undefined
)
const mockDelete = jest.fn((name: string) => {
  delete jar[name]
})
jest.mock('next/headers', () => ({
  cookies: async () => ({
    set: (name: string, value: string) => mockSet(name, value),
    get: (name: string) => mockGet(name),
    delete: (name: string) => mockDelete(name)
  })
}))

// Mirror the production Iron options (TTL in ms)
const ironOptions = { ...Iron.defaults, ttl: MAX_AGE * 1_000 }

describe('@/lib/session (integration with real @hapi/iron)', () => {
  beforeEach(() => {
    for (const key of Object.keys(jar)) delete jar[key]
    mockSet.mockClear()
    mockGet.mockClear()
    mockDelete.mockClear()
  })

  test('setSession then getSession round-trips the real payload', async () => {
    await setSession({ id: 'user-42', role: 'admin' })

    // A genuine Iron-sealed token (prefix `Fe26.2`) must have been stored
    const token = jar[TOKEN_NAME]
    expect(typeof token).toBe('string')
    expect(token).toMatch(/^Fe26\.2/)

    const session = await getSession()
    expect(session.id).toBe('user-42')
    expect(session.role).toBe('admin')
    expect(typeof session.createdAt).toBe('number')
    expect(session.maxAge).toBe(MAX_AGE)
  })

  test('getSession rejects a token sealed with the wrong secret', async () => {
    const wrongSecret = 'x'.repeat(40) // valid length, wrong value
    jar[TOKEN_NAME] = await Iron.seal(
      { id: 'user-42', createdAt: Date.now(), maxAge: MAX_AGE },
      wrongSecret,
      ironOptions
    )

    await expect(getSession()).rejects.toThrow()
  })

  test('sealing with a too-short secret fails (Iron enforces >= 32 chars)', async () => {
    const shortSecret = 'short-secret' // < 32 chars
    await expect(
      Iron.seal({ id: 'user-42' }, shortSecret, ironOptions)
    ).rejects.toThrow()
  })

  test('getSession rejects a tampered/malformed token', async () => {
    await setSession({ id: 'user-42' })
    jar[TOKEN_NAME] = `${jar[TOKEN_NAME]}tampered`

    await expect(getSession()).rejects.toThrow()
  })

  test('refreshSession issues a fresh 64-hex csrfToken and re-stamps createdAt', async () => {
    await setSession({ id: 'user-42', csrfToken: 'stale-csrf' })
    const before = await getSession()

    const refreshedAt = Date.now()
    await refreshSession()
    const after = await getSession()

    // Identity is preserved
    expect(after.id).toBe('user-42')
    // A fresh 64-hex CSRF token replaced the stale one
    expect(after.csrfToken).toMatch(/^[0-9a-f]{64}$/)
    expect(after.csrfToken).not.toBe(before.csrfToken)
    // createdAt is re-stamped to (at least) the refresh time
    expect(after.createdAt).toBeGreaterThanOrEqual(refreshedAt)
  })
})
