import { setLocaLStrategy } from '@/lib/strategy'
import { NextRequest } from 'next/server'
import passport from 'passport'

jest.mock('@/defs', () => ({
  errors: {
    invalidLogin: 'invalid login'
  }
}))

const authenticate = (req: NextRequest): Promise<any> =>
  new Promise((resolve, reject) => {
    passport.authenticate(
      'next-app-passport',
      { session: false },
      (err: Error, user: any) => {
        if (err) reject(err)
        else resolve(user)
      }
    )(req)
  })

const mockFindUser = jest.fn()
const findUser = async (res: any) => mockFindUser(res)

const mockValidatePassword = jest.fn()
const validatePassword = (user: any, res: any) =>
  mockValidatePassword(user, res)

const mockJson = jest.fn()
const req = {
  json: async () => mockJson()
} as NextRequest

describe('@/lib/strategy', () => {
  beforeEach(() => {
    mockFindUser.mockReset()
    mockFindUser.mockImplementation(() => ({ id: 'id' }))
    mockValidatePassword.mockReset()
    mockValidatePassword.mockImplementation(() => true)
    mockJson.mockReset()
    mockJson.mockImplementation(() => ({
      username: 'username',
      password: 'password'
    }))
  })

  test('success', async () => {
    setLocaLStrategy(findUser, validatePassword)
    const user = await authenticate(req)
    expect(mockFindUser).toHaveBeenCalledTimes(1)
    expect(mockFindUser).toHaveBeenCalledWith({
      username: 'username',
      password: 'password'
    })
    expect(mockValidatePassword).toHaveBeenCalledTimes(1)
    expect(mockValidatePassword).toHaveBeenCalledWith(
      { id: 'id' },
      {
        username: 'username',
        password: 'password'
      }
    )
    expect(user).toEqual({ id: 'id' })
  })

  test('wrong password', async () => {
    mockValidatePassword.mockImplementation(() => false)
    try {
      await authenticate(req)
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('invalid login')
    }
  })

  test('findUser error', async () => {
    mockFindUser.mockImplementation(() => {
      throw new Error('find user error')
    })
    try {
      await authenticate(req)
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('find user error')
    }
  })

  test('json error', async () => {
    mockJson.mockImplementation(() => {
      throw new Error('json error')
    })
    try {
      await authenticate(req)
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.message).toBe('json error')
    }
  })
})
