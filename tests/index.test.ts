import { NextRequest } from 'next/server'

import NextjsAppPassport from '@/index'

const mockLogin = jest.fn()
jest.mock('@/app/api/login', () => ({
  loginRoute: async () => mockLogin()
}))
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
const mockStrategy = jest.fn()
jest.mock('@/lib/strategy', () => ({
  setLocaLStrategy: () => mockStrategy()
}))

describe('@/index', () => {
  const req = {} as NextRequest
  const findUser = jest.fn()
  const validatePassword = jest.fn()

  test('default', async () => {
    await NextjsAppPassport.APILoginRoute(req)
    expect(mockLogin).toHaveBeenCalledTimes(1)

    await NextjsAppPassport.APILogoutRoute()
    expect(mockLogout).toHaveBeenCalledTimes(1)

    await NextjsAppPassport.APIRefreshSessionRoute()
    expect(mockRefreshSession).toHaveBeenCalledTimes(1)

    NextjsAppPassport.setLocaLStrategy(findUser, validatePassword)
    expect(mockStrategy).toHaveBeenCalledTimes(1)
  })
})
