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

const mockUnseal = jest.fn()
jest.mock('@hapi/iron', () => ({
  seal: async () => 'cryptedToken',
  unseal: async () => mockUnseal()
}))

jest.mock('@/defs', () => ({
  errors: {
    tokenNotFound: 'token empty',
    sessionExpired: 'expired error',
    refreshFailed: 'refresh error'
  },
  MAX_AGE: 60 * 60 * 8,
  SECURE_COOKIE: false,
  TOKEN_NAME: 'nextjs-app-passport',
  NEXTJS_APP_PASSPORT_TOKEN: 'abcdefghijklmnopqrstuvwxyz123456789'
}))

jest.useFakeTimers().setSystemTime(new Date('1986-11-20'))

describe('@/lib/session', () => {
  const session = { id: 'id' }

  beforeEach(() => {
    mockSet.mockReset()
    mockGet.mockReset()
    mockDelete.mockReset()
    mockUnseal.mockReset()
    mockUnseal.mockImplementation(() => ({
      createdAt: new Date(),
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
      createdAt: new Date(),
      maxAge: 60 * 60 * 8
    })

    // Expired
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

    // Error
    mockUnseal.mockImplementation(() => {
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
