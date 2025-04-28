import { NextRequest } from 'next/server'

import { Session } from '@/defs/index.d'

import { FindUser, ValidatePassword } from '@/lib/strategy/index'

export declare const APILoginRoute = (req: NextRequest) => Promise<Response>
export declare const APILogoutRoute = () => Promise<Response>
export declare const APIRefreshSessionRoute = () => Promise<Response>
export declare const getSession = () => Promise<Session>
export declare const setLocaLStrategy = (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => Promise<any>

declare const NodeAppPassport = {
  APILoginRoute,
  APILogoutRoute,
  APIRefreshSessionRoute,
  getSession,
  setLocaLStrategy
}

export default NodeAppPassport
