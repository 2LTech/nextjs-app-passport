import { NextRequest } from 'next/server'

/** Minimal contract every authenticated user must satisfy (a string `id`). */
export type SessionUser = { id: string }

export type FindUser<TUser extends SessionUser = SessionUser> = (
  body: unknown
) => Promise<TUser | null | undefined>
export type ValidatePassword<TUser extends SessionUser = SessionUser> = (
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
/**
 * Returns the decrypted session. `TUser` is a caller-provided assertion of the
 * extra fields stored alongside the base {@link Session}; it is not verified at
 * runtime, so the object persisted by `setLocalStrategy`/login must actually
 * satisfy `Session & TUser`.
 */
export declare const getSession: <TUser = unknown>() => Promise<Session & TUser>
export declare const setLocalStrategy: <
  TUser extends SessionUser = SessionUser
>(
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
