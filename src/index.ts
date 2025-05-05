import { loginRoute } from '@/app/api/login'
import { logoutRoute } from '@/app/api/logout'
import { getSession } from '@/lib/session'
import { refreshSessionRoute } from '@/app/api/refreshSession'

import { setLocaLStrategy as setLocaLStrategy0 } from '@/lib/strategy'

// API routes
export const APILoginRoute = loginRoute
export const APILogoutRoute = logoutRoute
export const APIRefreshSessionRoute = refreshSessionRoute

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
