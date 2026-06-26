import { NextRequest } from 'next/server'

export type FindUser<TUser = unknown> = (
  body: unknown
) => Promise<TUser | null | undefined>
export type ValidatePassword<TUser = unknown> = (
  user: TUser,
  body: unknown
) => boolean

export interface Session {
  id: string
  [key: string]: unknown
}

export declare const APILoginRoute: (req: NextRequest) => Promise<Response>
export declare const APILogoutRoute: () => Promise<Response>
export declare const APIRefreshSessionRoute: () => Promise<Response>
export declare const getSession: <TUser = unknown>() => Promise<Session & TUser>
export declare const setLocalStrategy: <TUser = unknown>(
  findUser: FindUser<TUser>,
  validatePassword: ValidatePassword<TUser>
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
