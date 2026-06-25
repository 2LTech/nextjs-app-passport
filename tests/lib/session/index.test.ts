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
  defaults: {},
  seal: (...args: any[]) => mockSeal(...args),
  unseal: async () => mockUnseal()
}))

const ABSOLUTE_MAX_AGE = 60 * 60 * 24
jest.mock('@/defs', () => ({
  errors: {
    tokenNotFound: 'token empty',
    sessionExpired: 'expired error',
    refreshFailed: 'refresh error'
  },
  MAX_AGE: 60 * 60 * 8,
  ABSOLUTE_MAX_AGE: 60 * 60 * 24,
  SECURE_COOKIE: false,
  TOKEN_NAME: 'nextjs-app-passport',
  NEXTJS_APP_PASSPORT_TOKEN: 'abcdefghijklmnopqrstuvwxyz123456789'
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
    mockSeal.mockResolvedValue('cryptedToken')
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
      expires: new Date(Date.now() + 60 * 60 * 8 * 1000),
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
        expires: new Date(Date.now() + 60 * 60 * 8 * 1000),
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'lax'
      }
    )

    // setSession stamps both createdAt (sliding anchor) and issuedAt
    // (immutable absolute anchor) at the same instant
    const sealed = mockSeal.mock.calls[0][0]
    expect(sealed.createdAt).toBe(Date.now())
    expect(sealed.issuedAt).toBe(Date.now())
    expect(sealed.maxAge).toBe(60 * 60 * 8)
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
      maxAge: 60 * 60 * 8
    })

    // Expired (sliding window elapsed)
    mockUnseal.mockImplementation(() => ({
      createdAt: 0,
      maxAge: 60 * 60 * 8
    }))
    try {
      await getSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('expired error')
    }
  })

  test('getSession - missing/NaN maxAge treated as expired', async () => {
    mockGet.mockImplementation(() => ({ value: 'token' }))

    // maxAge absent
    mockUnseal.mockImplementation(() => ({ id: 'id', createdAt: Date.now() }))
    await expect(getSession()).rejects.toThrow('expired error')

    // maxAge non-numeric
    mockUnseal.mockImplementation(() => ({
      id: 'id',
      createdAt: Date.now(),
      maxAge: 'forever'
    }))
    await expect(getSession()).rejects.toThrow('expired error')
  })

  test('refreshSession', async () => {
    // Empty
    try {
      await refreshSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('token empty')
    }
    expect(mockGet).toHaveBeenCalledTimes(1)

    // Normal
    mockGet.mockImplementation(() => ({ value: 'token' }))
    await refreshSession()
    expect(mockSet).toHaveBeenCalledTimes(1)
    expect(mockSet).toHaveBeenCalledWith(
      'nextjs-app-passport',
      'cryptedToken',
      {
        maxAge: 60 * 60 * 8,
        expires: new Date(Date.now() + 60 * 60 * 8 * 1000),
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'lax'
      }
    )

    // Error: decryption failures now propagate the raw Iron error (aligned
    // with getSession) instead of being flattened into refreshFailed.
    mockUnseal.mockImplementation(() => {
      throw new Error('unseal error')
    })
    try {
      await refreshSession()
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('unseal error')
    }
  })

  test('refreshSession - expired session is rejected', async () => {
    mockGet.mockImplementation(() => ({ value: 'token' }))
    // Sliding window already elapsed (createdAt far in the past)
    mockUnseal.mockImplementation(() => ({
      id: 'id',
      issuedAt: 0,
      createdAt: 0,
      maxAge: 60 * 60 * 8
    }))

    await expect(refreshSession()).rejects.toThrow('expired error')
    // It must NOT re-issue an expired session
    expect(mockSeal).not.toHaveBeenCalled()
    expect(mockSet).not.toHaveBeenCalled()
  })

  test('refreshSession - absolute lifetime ceiling blocks refresh', async () => {
    mockGet.mockImplementation(() => ({ value: 'token' }))
    const now = Date.now()
    // Sliding window is still open (createdAt 1s ago) but the session was
    // issued just past the 24h absolute ceiling: it must still be rejected.
    mockUnseal.mockImplementation(() => ({
      id: 'id',
      issuedAt: now - ABSOLUTE_MAX_AGE * 1000 - 1000,
      createdAt: now - 1000,
      maxAge: 60 * 60 * 8
    }))

    await expect(refreshSession()).rejects.toThrow('expired error')
    expect(mockSeal).not.toHaveBeenCalled()
  })

  test('refreshSession - preserves issuedAt and rotates csrf/createdAt', async () => {
    mockGet.mockImplementation(() => ({ value: 'token' }))
    const now = Date.now()
    const issuedAt = now - 60 * 60 * 1000 // issued 1h ago, within the ceiling
    mockUnseal.mockImplementation(() => ({
      id: 'id',
      issuedAt,
      createdAt: now - 60 * 60 * 1000,
      maxAge: 60 * 60 * 8,
      csrfToken: 'old-token'
    }))

    await refreshSession()
    expect(mockSeal).toHaveBeenCalledTimes(1)

    const sealed = mockSeal.mock.calls[0][0]
    expect(sealed.issuedAt).toBe(issuedAt) // immutable anchor preserved
    expect(sealed.createdAt).toBe(now) // sliding window advanced
    expect(sealed.csrfToken).not.toBe('old-token') // CSRF rotated
    expect(typeof sealed.csrfToken).toBe('string')
    expect(sealed.csrfToken.length).toBe(64) // 32 bytes hex
  })

  test('refreshSession - ceiling holds across repeated refreshes', async () => {
    mockGet.mockImplementation(() => ({ value: 'token' }))
    const loginTime = Date.now()

    // The "stored" session is updated by each successful refresh, exactly as a
    // re-sealed cookie would carry forward into the next request.
    let current: any = {
      id: 'id',
      issuedAt: loginTime,
      createdAt: loginTime,
      maxAge: 60 * 60 * 8
    }
    mockUnseal.mockImplementation(() => current)
    mockSeal.mockImplementation(async (obj: any) => {
      current = obj
      return 'cryptedToken'
    })

    const hour = 60 * 60 * 1000

    // Refresh every 6h. issuedAt must never move.
    jest.setSystemTime(new Date(loginTime + 6 * hour))
    await refreshSession()
    expect(current.issuedAt).toBe(loginTime)

    jest.setSystemTime(new Date(loginTime + 12 * hour))
    await refreshSession()
    expect(current.issuedAt).toBe(loginTime)

    jest.setSystemTime(new Date(loginTime + 18 * hour))
    await refreshSession()
    expect(current.issuedAt).toBe(loginTime)

    // At 25h the sliding window alone would still allow it (createdAt was 18h,
    // window ends at 26h), but the absolute 24h ceiling must reject it.
    jest.setSystemTime(new Date(loginTime + 25 * hour))
    await expect(refreshSession()).rejects.toThrow('expired error')
  })
})
