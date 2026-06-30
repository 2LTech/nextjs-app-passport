import { NextRequest } from 'next/server'
import passport from 'passport'

import { errors } from '@/defs'
import { setSession } from '@/lib/session'
import {
  buildCustomStrategy,
  FindUser,
  MinimalSession,
  strategyName,
  ValidatePassword
} from '@/lib/strategy'

// Interface
interface Authenticator {
  authenticate(
    strategy: string,
    options: { session: boolean },
    callback: (err: any, user?: any) => void
  ): (req: unknown, res?: unknown, next?: (err?: any) => void) => void
}

/**
 * Authenticate
 * @param req Request
 * @returns Token
 */
const authenticate = (
  instance: Authenticator,
  req: NextRequest
): Promise<any> =>
  new Promise((resolve, reject) => {
    // Guard against double-settling if both the callback and `next` ever fire.
    let settled = false
    const settle = (fn: (value: any) => void, value: any) => {
      if (settled) return
      settled = true
      fn(value)
    }

    const middleware = instance.authenticate(
      strategyName,
      { session: false },
      (err: Error, user: any) => {
        if (err) settle(reject, err)
        else settle(resolve, user)
      }
    )

    const next = (err?: any) =>
      settle(reject, err ?? new Error(errors.invalidAuthentication))

    middleware(req, undefined, next)
  })

/**
 * Create login
 * @param findUser FindUser function
 * @param validatePassword validatePassword function
 * @returns Login
 */
const createLogin =
  <User extends MinimalSession>(
    findUser: FindUser<User>,
    validatePassword: ValidatePassword<User>
  ) =>
  async (request: NextRequest): Promise<void> => {
    const instance = new passport.Passport()
    instance.use(strategyName, buildCustomStrategy(findUser, validatePassword))

    const user = await authenticate(instance, request)
    if (!user) throw new Error(errors.invalidAuthentication)

    const session = { ...user }
    await setSession(session)
  }

export default createLogin
