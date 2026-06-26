import { NextRequest } from 'next/server'

import NextjsAppPassport from '@/index'

const mockCreateLogin = jest.fn()
jest.mock(
  '@/app/api/login',
  () =>
    (...args: any) =>
    async (req: NextRequest) =>
      mockCreateLogin(...args, req)
)
const mockLogout = jest.fn()
jest.mock('@/app/api/logout', () => ({
  logoutRoute: async () => mockLogout()
}))
const mockRefreshSession = jest.fn()
jest.mock('@/app/api/refreshSession', () => ({
  refreshSessionRoute: async () => mockRefreshSession()
}))
const mockGetSession = jest.fn()
jest.mock('@/lib/session', () => ({
  getSession: async () => mockGetSession()
}))

describe('@/index', () => {
  const req = {} as NextRequest
  const findUser = jest.fn()
  const validatePassword = jest.fn()

  test('default', async () => {
    await NextjsAppPassport.APICreateLoginRoute(findUser, validatePassword)(req)
    expect(mockCreateLogin).toHaveBeenCalledTimes(1)

    await NextjsAppPassport.APILogoutRoute(req)
    expect(mockLogout).toHaveBeenCalledTimes(1)

    await NextjsAppPassport.APIRefreshSessionRoute(req)
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)
  })
})
