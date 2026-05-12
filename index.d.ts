import { NextRequest } from 'next/server'

export type FindUser = (body: any) => Promise<{ user?: any }>
export type ValidatePassword = (user: any, body: any) => boolean

export interface Session {
  id: string
  [key: string]: any
}

export declare const APILoginRoute = async (req: NextRequest) =>
  Response['json']()
export declare const APILogoutRoute = async () => Response['json']()
export declare const APIRefreshSessionRoute = async () => Response['json']()
export declare const getSession = async () => Session
export declare const setLocaLStrategy = async (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => undefined

declare const NextjsAppPassport = {
  APILoginRoute,
  APILogoutRoute,
  APIRefreshSessionRoute,
  getSession,
  setLocaLStrategy
}

export default NextjsAppPassport
