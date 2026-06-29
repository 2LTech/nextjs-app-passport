import { createLoginRoute } from '@/app/api/login'
import { logoutRoute } from '@/app/api/logout'
import { refreshSessionRoute } from '@/app/api/refreshSession'

import { getSession as getSession0 } from '@/lib/session'
import { defaultSerializeUser as defaultSerializeUser0 } from '@/lib/strategy'

export type { SerializeUser } from '@/lib/strategy'

// API routes
export const APICreateLoginRoute = createLoginRoute
export const APILogoutRoute = logoutRoute
export const APIRefreshSessionRoute = refreshSessionRoute

// Session
export const getSession = getSession0

// Default user serializer (safe-by-default projection); exported so apps can
// compose it, e.g. serializeUser: (u) => ({ ...defaultSerializeUser(u), foo })
export const defaultSerializeUser = defaultSerializeUser0

// Default
const NextjsAppPassport = {
  APICreateLoginRoute,
  APILogoutRoute,
  APIRefreshSessionRoute,
  getSession,
  defaultSerializeUser
}

export default NextjsAppPassport
