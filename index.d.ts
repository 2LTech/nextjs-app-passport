import { NextRequest } from 'next/server'

export type FindUser = (body: any) => Promise<any>
export type ValidatePassword = (user: any, body: any) => boolean

export interface Session {
  id: string
  [key: string]: any
}

export declare const APICreateLoginRoute: (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => (request: NextRequest) => Promise<Response>
export declare const APILogoutRoute: () => Promise<Response>
export declare const APIRefreshSessionRoute: () => Promise<Response>
export declare const getSession: () => Promise<Session>

declare const NextjsAppPassport: {
  APICreateLoginRoute: typeof APICreateLoginRoute
  APILogoutRoute: typeof APILogoutRoute
  APIRefreshSessionRoute: typeof APIRefreshSessionRoute
  getSession: typeof getSession
}

export default NextjsAppPassport
