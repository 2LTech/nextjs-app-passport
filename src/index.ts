import { loginRoute } from '@/app/api/login'
import { logoutRoute } from '@/app/api/logout'
import { getSessionRoute } from '@/app/api/getSession'
import { refreshSessionRoute } from '@/app/api/refreshSession'

import { setLocaLStrategy as setLocaLStrategy0 } from '@/lib/strategy'

// API routes
export const APILoginRoute = loginRoute
export const APILogoutRoute = logoutRoute
export const APIGetSessionRoute = getSessionRoute
export const APIRefreshSessionRoute = refreshSessionRoute

// Strategy
export const setLocaLStrategy = setLocaLStrategy0

// Default
const NodeAppPassport = {
  APILoginRoute,
  APILogoutRoute,
  APIGetSessionRoute,
  APIRefreshSessionRoute,
  setLocaLStrategy
}

export default NodeAppPassport
