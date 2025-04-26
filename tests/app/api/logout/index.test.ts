import { logoutRoute } from '@/app/api/logout'

const mockRemoveCookie = jest.fn()
jest.mock('@/lib/session', () => ({
  removeCookie: async () => mockRemoveCookie()
}))

describe('@/app/api/logout', () => {
  beforeEach(() => {
    mockRemoveCookie.mockReset()
  })

  test('logoutRoute', async () => {
    const res = await logoutRoute()
    expect(mockRemoveCookie).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('error', async () => {
    const error = 'logout error'
    mockRemoveCookie.mockImplementation(() => {
      throw new Error(error)
    })
    const res = await logoutRoute()
    expect(mockRemoveCookie).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(error)
  })
})
