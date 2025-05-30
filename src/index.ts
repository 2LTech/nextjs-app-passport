import { loginRoute } from '@/app/api/login'
import { logoutRoute } from '@/app/api/logout'
import { refreshSessionRoute } from '@/app/api/refreshSession'

import { getSession as getSession0 } from '@/lib/session'
import { setLocaLStrategy as setLocaLStrategy0 } from '@/lib/strategy'

// API routes
export const APILoginRoute = loginRoute
export const APILogoutRoute = logoutRoute
export const APIRefreshSessionRoute = refreshSessionRoute

// Session
export const getSession = getSession0

// Strategy
export const setLocaLStrategy = setLocaLStrategy0

// Default
const NextjsAppPassport = {
  APILoginRoute,
  APILogoutRoute,
  APIRefreshSessionRoute,
  getSession,
  setLocaLStrategy
}

export default NextjsAppPassport
