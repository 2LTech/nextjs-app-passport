import {
  getCookie,
  getSession,
  refreshSession,
  removeCookie,
  setCookie,
  setSession
} from '@/lib/session'

const mockSet = jest.fn()
const mockGet = jest.fn()
const mockDelete = jest.fn()
jest.mock('next/headers', () => ({
  cookies: async () => ({
    set: mockSet,
    get: mockGet,
    delete: mockDelete
  })
}))

const mockSeal = jest.fn()
const mockUnseal = jest.fn()
jest.mock('@hapi/iron', () => ({
  seal: async (...args: any) => mockSeal(args),
  unseal: async (...args: any) => mockUnseal(args)
}))

const MAX_AGE = 60 * 60 * 8
const ABSOLUTE_MAX_AGE = 60 * 60 * 24
const TOKEN_SECRET = 'token-secret'
const IRON_TTL = MAX_AGE * 1_000
jest.mock('@/defs', () => ({
  errors: {
    tokenNotFound: 'token empty',
    sessionExpired: 'expired error',
    refreshFailed: 'refresh error'
  },
  MAX_AGE,
  ABSOLUTE_MAX_AGE,
  SECURE_COOKIE: false,
  TOKEN_NAME: 'nextjs-app-passport',
  TOKEN_SECRET
}))

jest.useFakeTimers()

describe('@/lib/session', () => {
  const session = { id: 'id' }

  beforeEach(() => {
    jest.setSystemTime(new Date('1986-11-20'))

    mockSet.mockReset()
    mockGet.mockReset()
    mockDelete.mockReset()

    mockSeal.mockReset()
    mockSeal.mockImplementation(() => 'cryptedToken')
    mockUnseal.mockReset()
    mockUnseal.mockImplementation(() => ({
      createdAt: Date.now(),
      maxAge: 60 * 60 * 8
    }))
  })

  test('setCookie', async () => {
    await setCookie('token')
    expect(mockSet).toHaveBeenCalledTimes(1)
    expect(mockSet).toHaveBeenCalledWith('nextjs-app-passport', 'token', {
      maxAge: 60 * 60 * 8,
      expires: new Date(Date.now() + 60 * 60 * 8 * 1_000),
      httpOnly: true,
      secure: false,
      path: '/',
      sameSite: 'lax'
    })
  })

  test('getCookie', async () => {
    let value = await getCookie()
    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith('nextjs-app-passport')
    expect(value).toBe(undefined)

    mockGet.mockImplementation(() => ({ value: 'token' }))
    value = await getCookie()
    expect(value).toBe('token')
  })

  test('removeCookie', async () => {
    await removeCookie()
    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(mockDelete).toHaveBeenCalledWith('nextjs-app-passport')
  })

  test('setSession', async () => {
    await setSession(session)
    expect(mockSet).toHaveBeenCalledTimes(1)
    expect(mockSet).toHaveBeenCalledWith(
      'nextjs-app-passport',
      'cryptedToken',
      {
        maxAge: 60 * 60 * 8,
        expires: new Date(Date.now() + 60 * 60 * 8 * 1_000),
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'lax'
      }
    )
  })

  test('getSession', async () => {
    // Empty
    try {
      await getSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('token empty')
    }
    expect(mockGet).toHaveBeenCalledTimes(1)

    // Normal
    mockGet.mockImplementation(() => ({ value: 'token' }))
    const value = await getSession()
    expect(value).toEqual({
      createdAt: Date.now(),
      maxAge: MAX_AGE
    })
    expect(mockUnseal).toHaveBeenCalledWith([
      'token',
      TOKEN_SECRET,
      { ttl: IRON_TTL }
    ])

    // Expired
    mockUnseal.mockImplementation(() => ({
      createdAt: 0,
      maxAge: MAX_AGE
    }))
    try {
      await getSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('expired error')
    }

    // Wrong createdAt
    mockUnseal.mockImplementation(() => ({
      createdAt: Number.NaN,
      maxAge: MAX_AGE
    }))
    try {
      await getSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('expired error')
    }

    // Wrong maxAge
    mockUnseal.mockImplementation(() => ({
      createdAt: Date.now(),
      maxAge: Number.NaN
    }))
    try {
      await getSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('expired error')
    }

    // Malformed/tampered token: getSession does NOT wrap Iron.unseal, so the
    // raw decryption error surfaces unchanged to the caller.
    mockUnseal.mockImplementation(() => {
      throw new Error('Bad hmac value')
    })
    try {
      await getSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('Bad hmac value')
    }
  })

  test('refreshSession', async () => {
    // Empty
    mockGet.mockImplementation(() => ({ value: undefined }))
    try {
      await refreshSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('token empty')
    }
    expect(mockGet).toHaveBeenCalledTimes(1)

    // Expired: refreshSession enforces lifetime via getSession BEFORE
    // re-issuing, so an expired session is rejected and the cookie is never
    // overwritten (no new token is minted for a dead session).
    mockGet.mockImplementation(() => ({ value: 'token' }))
    mockUnseal.mockImplementation(() => ({
      createdAt: 0,
      maxAge: MAX_AGE
    }))
    try {
      await refreshSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('expired error')
    }
    expect(mockSet).not.toHaveBeenCalled()

    // Normal
    mockGet.mockImplementation(() => ({ value: 'token' }))
    mockUnseal.mockImplementation(() => ({
      createdAt: Date.now(),
      maxAge: 60 * 60 * 8,
      issuedAt: Date.now()
    }))
    await refreshSession()
    expect(mockSet).toHaveBeenCalledTimes(1)
    expect(mockSet).toHaveBeenCalledWith(
      'nextjs-app-passport',
      'cryptedToken',
      {
        maxAge: 60 * 60 * 8,
        expires: new Date(Date.now() + 60 * 60 * 8 * 1_000),
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'lax'
      }
    )
    // The sealed payload (token string is stubbed) carries a freshly minted
    // 64-hex CSRF token and a re-stamped createdAt.
    const [sealedSession] = mockSeal.mock.calls.at(-1)![0]
    expect(sealedSession.csrfToken).toMatch(/^[0-9a-f]{64}$/)
    expect(sealedSession.createdAt).toBe(Date.now())

    // Wrong issuedAt
    mockGet.mockImplementation(() => ({ value: 'token' }))
    mockUnseal.mockImplementation(() => ({
      createdAt: Date.now(),
      maxAge: 60 * 60 * 8,
      issuedAt: Number.NaN
    }))
    await refreshSession()
    expect(mockSet).toHaveBeenCalledTimes(2)
    expect(mockSet).toHaveBeenCalledWith(
      'nextjs-app-passport',
      'cryptedToken',
      {
        maxAge: 60 * 60 * 8,
        expires: new Date(Date.now() + 60 * 60 * 8 * 1_000),
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'lax'
      }
    )

    // Error
    mockSeal.mockImplementation(() => {
      throw new Error('unseal error')
    })
    try {
      await refreshSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('refresh error')
    }
  })
})
