import { NextRequest } from 'next/server'

export type MinimalSession = { id: string }
export type FindUser<User extends MinimalSession> = (
  body: unknown
) => Promise<User | null | undefined>
export type ValidatePassword<User extends MinimalSession> = (
  user: User,
  body: unknown
) => Promise<boolean>

export interface Session {
  id: string
  createdAt: number
  issuedAt: number
  maxAge: number
  [key: string]: unknown
}

export declare const APICreateLoginRoute: <User extends MinimalSession>(
  findUser: FindUser<User>,
  validatePassword: ValidatePassword<User>
) => (request: NextRequest) => Promise<Response>
export declare const APILogoutRoute: (request: NextRequest) => Promise<Response>
export declare const APIRefreshSessionRoute: (
  request: NextRequest
) => Promise<Response>
export declare const getSession: (additionalData?: string[]) => Promise<Session>

declare const NextjsAppPassport: {
  APICreateLoginRoute: typeof APICreateLoginRoute
  APILogoutRoute: typeof APILogoutRoute
  APIRefreshSessionRoute: typeof APIRefreshSessionRoute
  getSession: typeof getSession
}

export default NextjsAppPassport
