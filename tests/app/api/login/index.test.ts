import { loginRoute, createLoginRoute } from '@/app/api/login'
import { NextRequest } from 'next/server'

const mockLogin = jest.fn()
const mockCreateLogin = jest.fn()
jest.mock('@/lib/login', () => ({
  __esModule: true,
  default: async (req: any) => mockLogin(req),
  createLogin: (findUser: any, validatePassword: any) => async (req: any) =>
    mockCreateLogin(findUser, validatePassword, req)
}))

describe('@/app/api/login', () => {
  const req = {} as NextRequest

  beforeEach(() => {
    mockLogin.mockReset()
    mockCreateLogin.mockReset()
  })

  test('loginRoute', async () => {
    const res = await loginRoute(req)
    expect(mockLogin).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('loginRoute error', async () => {
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

  test('createLoginRoute', async () => {
    const findUser = jest.fn()
    const validatePassword = jest.fn()
    const res = await createLoginRoute(findUser, validatePassword)(req)
    expect(mockCreateLogin).toHaveBeenCalledTimes(1)
    expect(mockCreateLogin).toHaveBeenCalledWith(
      findUser,
      validatePassword,
      req
    )

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('createLoginRoute error', async () => {
    const error = 'create login error'
    mockCreateLogin.mockImplementation(() => {
      throw new Error(error)
    })
    const res = await createLoginRoute(jest.fn(), jest.fn())(req)
    expect(mockCreateLogin).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(error)
  })
})
