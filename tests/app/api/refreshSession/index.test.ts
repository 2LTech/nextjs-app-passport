import { refreshSessionRoute } from '@/app/api/refreshSession'

const mockRefreshSession = jest.fn()
jest.mock('@/lib/session', () => ({
  refreshSession: async () => mockRefreshSession()
}))

describe('@/app/api/refresh', () => {
  beforeEach(() => {
    mockRefreshSession.mockReset()
  })

  test('refreshRoute', async () => {
    const res = await refreshSessionRoute()
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('error', async () => {
    const error = 'refresh error'
    mockRefreshSession.mockImplementation(() => {
      throw new Error(error)
    })
    const res = await refreshSessionRoute()
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(error)
  })
})
