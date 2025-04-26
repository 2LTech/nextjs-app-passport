import { loginRoute } from '@/app/api/login'
import { logoutRoute } from '@/app/api/logout'
import { refreshRoute } from '@/app/api/refresh'

import { setLocaLStrategy as setLocaLStrategy0 } from '@/lib/strategy'

// API routes
export const APILoginRoute = loginRoute
export const APILogoutRoute = logoutRoute
export const APIRefreshRoute = refreshRoute

// Strategy
export const setLocaLStrategy = setLocaLStrategy0

const NodeAppPassport = {
  APILoginRoute,
  APILogoutRoute,
  APIRefreshRoute,
  setLocaLStrategy
}

export default NodeAppPassport
