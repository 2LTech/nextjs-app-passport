import { NextRequest } from 'next/server'

export type FindUser = (body: any) => Promise<any>
export type ValidatePassword = (user: any, body: any) => boolean
export type SerializeUser = (user: any) => any

export interface Session {
  id: string
  [key: string]: any
}

export declare const APICreateLoginRoute: (
  findUser: FindUser,
  validatePassword: ValidatePassword,
  serializeUser?: SerializeUser
) => (req: NextRequest) => Promise<Response>
export declare const APILogoutRoute: () => Promise<Response>
export declare const APIRefreshSessionRoute: () => Promise<Response>
export declare const getSession: () => Promise<Session>
export declare const defaultSerializeUser: SerializeUser

declare const NextjsAppPassport: {
  APICreateLoginRoute: typeof APICreateLoginRoute
  APILogoutRoute: typeof APILogoutRoute
  APIRefreshSessionRoute: typeof APIRefreshSessionRoute
  getSession: typeof getSession
  defaultSerializeUser: typeof defaultSerializeUser
}

export default NextjsAppPassport
