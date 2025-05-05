import { NextRequest } from 'next/server'

import { Session } from '@/defs'
import { FindUser, ValidatePassword } from '@/lib/strategy/index'

export declare const APILoginRoute = async (req: NextRequest) =>
  Response['json']()
export declare const APILogoutRoute = async () => Response['json']()
export declare const APIRefreshSessionRoute = async () => Response['json']()
export declare const getSession = async () => Session
export declare const setLocaLStrategy = async (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => any

declare const NextjsAppPassport = {
  APILoginRoute,
  APILogoutRoute,
  APIRefreshSessionRoute,
  getSession,
  setLocaLStrategy
}

export default NextjsAppPassport
