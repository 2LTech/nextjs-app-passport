import { NextRequest } from 'next/server'

export type FindUser = (body: any) => Promise<any>
export type ValidatePassword = (user: any, body: any) => boolean

export interface Session {
  id: string
  [key: string]: any
}

export declare const APILoginRoute: (req: NextRequest) => Promise<Response>
export declare const APILogoutRoute: () => Promise<Response>
export declare const APIRefreshSessionRoute: () => Promise<Response>
export declare const getSession: () => Promise<Session>
export declare const setLocalStrategy: (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => void

declare const NextjsAppPassport: {
  APILoginRoute: typeof APILoginRoute
  APILogoutRoute: typeof APILogoutRoute
  APIRefreshSessionRoute: typeof APIRefreshSessionRoute
  getSession: typeof getSession
  setLocalStrategy: typeof setLocalStrategy
  //@deprecated use setLocalStrategy instead
  setLocaLStrategy: typeof setLocalStrategy
}

export default NextjsAppPassport
