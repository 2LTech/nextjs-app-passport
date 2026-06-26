import { logoutRoute } from '@/app/api/logout'

import { internalErrorMessage } from '@/lib/api/response'

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
    expect(res.status).toBe(200)
    expect(mockRemoveCookie).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('unknown internal error, 500', async () => {
    const rawMessage = 'some internal server error'
    mockRemoveCookie.mockImplementation(() => {
      throw new Error(rawMessage)
    })
    const res = await logoutRoute()
    expect(res.status).toBe(500)
    expect(mockRemoveCookie).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(internalErrorMessage)
    expect(consoleError).toHaveBeenCalledWith(new Error(rawMessage))
  })
})
