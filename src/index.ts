import { POST as login } from '@/app/api/login/route'
import { GET as logout } from '@/app/api/logout/route'
import { GET as refresh } from '@/app/api/refresh/route'

import { setLocaLStrategy as setLocaLStrategy0 } from '@/lib/strategy'

// API routes
export const APILoginRoute = login
export const APILogoutRoute = logout
export const APIRefreshRoute = refresh

// Strategy
export const setLocaLStrategy = setLocaLStrategy0

const NodeAppPassport = {
  APILoginRoute,
  APILogoutRoute,
  APIRefreshRoute,
  setLocaLStrategy
}

export default NodeAppPassport
