import { loginRoute } from '@/app/api/login'
import { NextRequest } from 'next/server'

const mockLogin = jest.fn()
jest.mock('@/lib/login', () => async () => mockLogin())

describe('@/app/api/login', () => {
  const req = {} as NextRequest

  beforeEach(() => {
    mockLogin.mockReset()
  })

  test('loginRoute', async () => {
    const res = await loginRoute(req)
    expect(mockLogin).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('error', async () => {
    const error = 'login error'
    mockLogin.mockImplementation(() => {
      throw new Error(error)
    })
    const res = await loginRoute(req)
    expect(mockLogin).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(error)
  })
})
