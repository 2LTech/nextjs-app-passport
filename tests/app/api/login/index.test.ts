import { NextRequest } from 'next/server'

import { createLoginRoute } from '@/app/api/login'

import { errors } from '@/defs'

import { internalErrorMessage } from '@/lib/api/response'
import { FindUser, ValidatePassword } from '@/lib/strategy'

const mockCreateLogin = jest.fn()
jest.mock(
  '@/lib/login',
  () =>
    (...args: any) =>
    async (req: NextRequest) =>
      mockCreateLogin(...args, req)
)

const mockGuard = jest.fn()
jest.mock('@/lib/api/security', () => ({
  guard: () => mockGuard()
}))

describe('@/app/api/login', () => {
  const req = {} as NextRequest
  const findUser = jest.fn() as FindUser<{ id: string }>
  const validatePassword = jest.fn() as ValidatePassword<{ id: string }>
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    mockCreateLogin.mockReset()
    mockGuard.mockReset()
    mockGuard.mockImplementation(() => undefined)

    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('createLoginRoute', async () => {
    const res = await createLoginRoute(findUser, validatePassword)(req)
    expect(mockCreateLogin).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('guard', async () => {
    mockGuard.mockImplementation(() =>
      Response.json({ ok: false }, { status: 403 })
    )
    const res = await createLoginRoute(findUser, validatePassword)(req)
    expect(res.status).toBe(403)

    const data = await res.json()
    expect(data.ok).toBe(false)
  })

  test('invalid authentication, 401', async () => {
    mockCreateLogin.mockImplementation(() => {
      throw new Error(errors.invalidAuthentication)
    })
    const res = await createLoginRoute(findUser, validatePassword)(req)
    expect(res.status).toBe(401)
    expect(mockCreateLogin).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.invalidAuthentication)
  })

  test('unknown internal error, 500', async () => {
    const rawMessage = 'some internal server error'
    mockCreateLogin.mockImplementation(() => {
      throw new Error(rawMessage)
    })
    const res = await createLoginRoute(findUser, validatePassword)(req)
    expect(res.status).toBe(500)
    expect(mockCreateLogin).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(internalErrorMessage)
    expect(console.error).toHaveBeenCalledWith(new Error(rawMessage))
  })
})
