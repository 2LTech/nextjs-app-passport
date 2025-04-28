import { NextRequest } from 'next/server'

import { FindUser, ValidatePassword } from './src/lib/strategy/index'

export declare const APILoginRoute = (req: NextRequest) => Promise<Response>
export declare const APILogoutRoute = () => Promise<Response>
export declare const APIGetSessionRoute = () => Promise<Response>
export declare const APIRefreshSessionRoute = () => Promise<Response>
export declare const setLocaLStrategy = (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => Promise<any>

declare const NodeAppPassport = {
  APILoginRoute,
  APILogoutRoute,
  APIGetSessionRoute,
  APIRefreshSessionRoute,
  setLocaLStrategy
}

export default NodeAppPassport
