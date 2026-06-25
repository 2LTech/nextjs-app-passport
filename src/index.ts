import { loginRoute } from '@/app/api/login'
import { logoutRoute } from '@/app/api/logout'
import { refreshSessionRoute } from '@/app/api/refreshSession'

import { getSession as getSession0 } from '@/lib/session'
import { setLocalStrategy as setLocalStrategy0 } from '@/lib/strategy'

// API routes
export const APILoginRoute = loginRoute
export const APILogoutRoute = logoutRoute
export const APIRefreshSessionRoute = refreshSessionRoute

// Session
export const getSession = getSession0

// Strategy
export const setLocalStrategy = setLocalStrategy0
//@deprecated use setLocalStrategy instead
export const setLocaLStrategy = setLocalStrategy0

// Default
const NextjsAppPassport = {
  APILoginRoute,
  APILogoutRoute,
  APIRefreshSessionRoute,
  getSession,
  setLocalStrategy,
  setLocaLStrategy
}

export default NextjsAppPassport
