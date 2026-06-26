import { errors } from '@/defs'

import { errorResponse, internalErrorMessage } from '@/lib/api/response'

describe('@/lib/api/response', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('status by error', async () => {
    const unauthorizeds = [
      errors.tokenNotFound,
      errors.sessionExpired,
      errors.invalidAuthentication,
      errors.invalidLogin
    ]
    for (const message of unauthorizeds) {
      const res = errorResponse(new Error(message))
      expect(res.status).toBe(401)

      const data = await res.json()
      expect(data.ok).toBe(false)
      expect(data.err).toBe(message)
      expect(consoleError).toHaveBeenLastCalledWith(new Error(message))
    }

    const internals = [errors.refreshFailed]
    for (const message of internals) {
      const res = errorResponse(new Error(message))
      expect(res.status).toBe(500)

      const data = await res.json()
      expect(data.ok).toBe(false)
      expect(data.err).toBe(message)
      expect(consoleError).toHaveBeenLastCalledWith(new Error(message))
    }
  })

  test('unknown internal error', async () => {
    const rawMessage = 'raw internal detail'
    const err = new Error(rawMessage)
    const res = errorResponse(err)
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).not.toBe(rawMessage)
    expect(data.err).toBe(internalErrorMessage)
    expect(consoleError).toHaveBeenCalledWith(err)
  })

  test('non-Error', async () => {
    const nonErr = 'a thrown string'
    const res = errorResponse(nonErr)
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(internalErrorMessage)
    expect(consoleError).toHaveBeenCalledWith(nonErr)
  })
})
