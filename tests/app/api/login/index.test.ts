import { NextRequest } from 'next/server'

import { loginRoute } from '@/app/api/login'

import { errors } from '@/defs'

import { internalErrorMessage } from '@/lib/api/response'

const mockLogin = jest.fn()
jest.mock('@/lib/login', () => async () => mockLogin())

const mockGuard = jest.fn()
jest.mock('@/lib/api/security', () => ({
  guard: () => mockGuard()
}))

describe('@/app/api/login', () => {
  const req = {} as NextRequest
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    mockLogin.mockReset()
    mockGuard.mockReset()

    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('loginRoute', async () => {
    const res = await loginRoute(req)
    expect(res.status).toBe(200)
    expect(mockLogin).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('guard', async () => {
    mockGuard.mockImplementation(() =>
      Response.json({ ok: false }, { status: 403 })
    )
    const res = await loginRoute(req)
    expect(res.status).toBe(403)

    const data = await res.json()
    expect(data.ok).toBe(false)
  })

  test('invalid authentication, 401', async () => {
    mockLogin.mockImplementation(() => {
      throw new Error(errors.invalidAuthentication)
    })
    const res = await loginRoute(req)
    expect(res.status).toBe(401)
    expect(mockLogin).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.invalidAuthentication)
  })

  test('unknown internal error, 500', async () => {
    const rawMessage = 'some internal server error'
    mockLogin.mockImplementation(() => {
      throw new Error(rawMessage)
    })
    const res = await loginRoute(req)
    expect(res.status).toBe(500)
    expect(mockLogin).toHaveBeenCalledTimes(1)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(internalErrorMessage)
    expect(console.error).toHaveBeenCalledWith(new Error(rawMessage))
  })
})
