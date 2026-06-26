import { loginRoute } from '@/app/api/login'
import { NextRequest } from 'next/server'

import { errors } from '@/defs'
import { internalErrorMessage } from '@/lib/response'

const mockLogin = jest.fn()
jest.mock('@/lib/login', () => async () => mockLogin())

describe('@/app/api/login', () => {
  const req = {} as NextRequest

  let consoleError: jest.SpyInstance

  beforeEach(() => {
    mockLogin.mockReset()
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('loginRoute', async () => {
    const res = await loginRoute(req)
    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  test('invalid authentication -> 401', async () => {
    mockLogin.mockImplementation(() => {
      throw new Error(errors.invalidAuthentication)
    })
    const res = await loginRoute(req)
    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(401)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.invalidAuthentication)
  })

  test('unknown internal failure -> 500 without leaking raw message', async () => {
    const rawMessage = 'NEXTJS_APP_PASSPORT_TOKEN secret crypto detail'
    mockLogin.mockImplementation(() => {
      throw new Error(rawMessage)
    })
    const res = await loginRoute(req)
    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.ok).toBe(false)
    // Raw internal message must not be echoed to the client.
    expect(data.err).not.toBe(rawMessage)
    expect(data.err).toBe(internalErrorMessage)
    // Detail is still logged server-side.
    expect(consoleError).toHaveBeenCalled()
  })
})
