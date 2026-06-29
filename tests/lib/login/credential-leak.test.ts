import { NextRequest } from 'next/server'

import createLogin from '@/lib/login'
import { getSession } from '@/lib/session'

/**
 * End-to-end regression for AIR-197.
 *
 * Drives the real createLogin -> buildCustomStrategy -> setSession -> getSession
 * chain (real passport + real Iron seal/unseal, only the cookie jar mocked) to
 * prove credential material cannot reach the sealed cookie or getSession output.
 * This guards the login/session boundary, not just the strategy `done` callback.
 */

// In-memory cookie jar so login's setSession write is read back by getSession.
let storedToken: string | undefined
const mockSet = jest.fn((_name: string, value: string) => {
  storedToken = value
})
const mockGet = jest.fn((_name: string) =>
  storedToken ? { value: storedToken } : undefined
)
const mockDelete = jest.fn(() => {
  storedToken = undefined
})
jest.mock('next/headers', () => ({
  cookies: async () => ({ set: mockSet, get: mockGet, delete: mockDelete })
}))

const req = {
  json: async () => ({ username: 'username', password: 'password' })
} as unknown as NextRequest

const validatePassword = () => true

describe('AIR-197 credential leak (login/session boundary)', () => {
  beforeEach(() => {
    storedToken = undefined
    mockSet.mockClear()
    mockGet.mockClear()
    mockDelete.mockClear()
  })

  test('default serializer keeps credential fields out of the sealed session', async () => {
    // findUser returns the full user (validatePassword needs hash/salt).
    const findUser = async () => ({
      id: 'id',
      username: 'username',
      role: 'admin',
      hash: 'SECRET_HASH',
      salt: 'SECRET_SALT',
      password_hash: 'SECRET_PASSWORD_HASH'
    })

    await createLogin(findUser, validatePassword)(req)
    expect(mockSet).toHaveBeenCalledTimes(1)
    expect(storedToken).toBeDefined()

    // Unseal what was actually written into the cookie.
    const session = await getSession()
    expect(session).toMatchObject({
      id: 'id',
      username: 'username',
      role: 'admin'
    })
    expect(session.hash).toBeUndefined()
    expect(session.salt).toBeUndefined()
    expect(session.password_hash).toBeUndefined()
  })

  test('explicit allow-list serializer is honored end-to-end', async () => {
    const findUser = async () => ({
      id: 'id',
      username: 'username',
      hash: 'SECRET_HASH',
      credentials: { hash: 'NESTED_HASH', salt: 'NESTED_SALT' }
    })
    // Allow-list: only id + username are persisted (covers nested data the
    // default deny-list cannot reach).
    await createLogin(findUser, validatePassword, (user) => ({
      id: user.id,
      username: user.username
    }))(req)

    const session = await getSession()
    expect(session).toMatchObject({ id: 'id', username: 'username' })
    expect(session.hash).toBeUndefined()
    expect(session.credentials).toBeUndefined()
  })
})
