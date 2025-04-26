import { refreshRoute } from '@/app/api/refresh'

const mockRefreshSession = jest.fn()
jest.mock('@/lib/session', () => ({
  refreshSession: async () => mockRefreshSession()
}))

describe('@/app/api/refresh', () => {
  beforeEach(() => {
    mockRefreshSession.mockReset()
  })

  test('refreshRoute', async () => {
    const res = await refreshRoute()
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('error', async () => {
    const error = 'refresh error'
    mockRefreshSession.mockImplementation(() => {
      throw new Error(error)
    })
    const res = await refreshRoute()
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(error)
  })
})
