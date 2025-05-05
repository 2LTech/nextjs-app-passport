import { NextRequest } from 'next/server'

import { Session } from '@/defs/index.d'

import { FindUser, ValidatePassword } from '@/lib/strategy/index'

export declare const APILoginRoute = async (req: NextRequest) => Response
export declare const APILogoutRoute = async () => Response
export declare const APIRefreshSessionRoute = () => Response
export declare const getSession = async () => Session
export declare const setLocaLStrategy = async (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => any

declare const NodeAppPassport = {
  APILoginRoute,
  APILogoutRoute,
  APIRefreshSessionRoute,
  getSession,
  setLocaLStrategy
}

export default NodeAppPassport
