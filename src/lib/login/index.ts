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
    callback: (err: Error, user?: unknown) => void
  ): (req: unknown, res?: unknown, next?: (err?: Error) => void) => void
}

/**
 * Authenticate
 * @param req Request
 * @returns Token
 */
const authenticate = <User extends MinimalSession>(
  instance: Authenticator,
  req: NextRequest
): Promise<User> =>
  new Promise((resolve, reject) => {
    // Guard against double-settling if both the callback and `next` ever fire.
    let settled = false

    const resolveOnce = (user: User) => {
      if (settled) return
      settled = true
      resolve(user)
    }

    const rejectOnce = (err: Error) => {
      if (settled) return
      settled = true
      reject(err)
    }

    const middleware = instance.authenticate(
      strategyName,
      { session: false },
      (err, user) => {
        if (err) rejectOnce(err)
        else resolveOnce(user as User)
      }
    )

    const next = (err?: Error) =>
      rejectOnce(err ?? new Error(errors.invalidAuthentication))

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
