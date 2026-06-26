import { errors } from '@/defs'
import { errorResponse, internalErrorMessage } from '@/lib/response'

describe('@/lib/response', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  test('maps known auth/session errors to 401', async () => {
    for (const message of [
      errors.tokenNotFound,
      errors.sessionExpired,
      errors.invalidAuthentication,
      errors.invalidLogin
    ]) {
      const res = errorResponse(new Error(message))
      expect(res.status).toBe(401)

      const data = await res.json()
      expect(data.ok).toBe(false)
      expect(data.err).toBe(message)
    }
  })

  test('maps refresh failure to 500 with its safe message', async () => {
    const res = errorResponse(new Error(errors.refreshFailed))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(errors.refreshFailed)
  })

  test('maps unknown Error to a generic 500 and logs server-side', async () => {
    const rawMessage = 'raw internal detail'
    const res = errorResponse(new Error(rawMessage))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).not.toBe(rawMessage)
    expect(data.err).toBe(internalErrorMessage)
    expect(consoleError).toHaveBeenCalledTimes(1)
  })

  test('handles non-Error thrown values without leaking them', async () => {
    const res = errorResponse('a thrown string')
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.ok).toBe(false)
    expect(data.err).toBe(internalErrorMessage)
  })
})
