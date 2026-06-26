import { createLoginRoute } from '@/app/api/login'
import { logoutRoute } from '@/app/api/logout'
import { refreshSessionRoute } from '@/app/api/refreshSession'

import { getSession as getSession0 } from '@/lib/session'

// API routes
export const APICreateLoginRoute = createLoginRoute
export const APILogoutRoute = logoutRoute
export const APIRefreshSessionRoute = refreshSessionRoute

// Session
export const getSession = getSession0

// Default
const NextjsAppPassport = {
  APICreateLoginRoute,
  APILogoutRoute,
  APIRefreshSessionRoute,
  getSession
}

export default NextjsAppPassport
