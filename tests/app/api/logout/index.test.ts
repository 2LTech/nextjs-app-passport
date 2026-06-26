import { logoutRoute } from '@/app/api/logout'

import { internalErrorMessage } from '@/lib/response'

const mockRemoveCookie = jest.fn()
jest.mock('@/lib/session', () => ({
  removeCookie: async () => mockRemoveCookie()
}))

describe('@/app/api/logout', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    mockRemoveCookie.mockReset()
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('logoutRoute', async () => {
    const res = await logoutRoute()
    expect(mockRemoveCookie).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('unknown internal failure -> 500 without leaking raw message', async () => {
    const rawMessage = 'internal cookie deletion detail'
    mockRemoveCookie.mockImplementation(() => {
      throw new Error(rawMessage)
    })
    const res = await logoutRoute()
    expect(mockRemoveCookie).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).not.toBe(rawMessage)
    expect(data.err).toBe(internalErrorMessage)
    expect(consoleError).toHaveBeenCalled()
  })
})
