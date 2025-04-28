import { getSessionRoute } from '@/app/api/getSession'

const mockGetSession = jest.fn()
jest.mock('@/lib/session', () => ({
  getSession: async () => mockGetSession()
}))

describe('@/app/api/refresh', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
  })

  test('refreshRoute', async () => {
    const res = await getSessionRoute()
    expect(mockGetSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('error', async () => {
    const error = 'refresh error'
    mockGetSession.mockImplementation(() => {
      throw new Error(error)
    })
    const res = await getSessionRoute()
    expect(mockGetSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(error)
  })
})
