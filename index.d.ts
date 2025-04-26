import { NextRequest } from 'next/server'

import { FindUser, ValidatePassword } from './src/lib/strategy/index'

export type APILoginRoute = (req: NextRequest) => Promise<Response>
export type APILogoutRoute = () => Promise<Response>
export type APIRefreshRoute = () => Promise<Response>
export type setLocaLStrategy = (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => Promise<any>

export interface NodeAppPassport {
  APILoginRoute: APILoginRoute
  APILogoutRoute: APILogoutRoute
  APIRefreshRoute: APIRefreshRoute
  setLocaLStrategy: setLocaLStrategy
}

export default NodeAppPassport
