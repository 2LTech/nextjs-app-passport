import { NextRequest } from 'next/server'
import passport from 'passport'

import { errors } from '@/defs'
import { setSession } from '@/lib/session'
import {
  buildLocalStrategy,
  hasLocalStrategy,
  STRATEGY_NAME,
  FindUser,
  ValidatePassword
} from '@/lib/strategy'

/**
 * Minimal structural view of a Passport instance: only the `authenticate`
 * surface the login flow relies on. Both the process-global `passport`
 * singleton and a fresh `new passport.Passport()` satisfy it, while avoiding the
 * polymorphic `this` return of `@types/passport`'s `Authenticator` generic.
 */
interface AuthenticatorLike {
  authenticate(
    strategy: string,
    options: { session: boolean },
    callback: (err: any, user?: any) => void
  ): (req: unknown, res?: unknown, next?: (err?: any) => void) => void
}

/**
 * Run passport-custom authentication for a single request against a specific
 * Passport instance (global singleton or a per-request instance).
 *
 * res/next invariant: the authenticate middleware is invoked without a real
 * `res` and with only a defensive `next`. This is safe for THIS integration
 * because `{ session: false }` plus a custom verify callback makes passport
 * route every outcome (success / fail / error) through the callback — it never
 * touches `res` and only calls `next(err)` on an unexpected internal error. The
 * defensive `next` therefore turns any such future-proofing edge (e.g. a
 * strategy that calls `this.redirect`/`this.pass`, or a dropped `session:false`)
 * into a rejected promise instead of a `TypeError` on `undefined`.
 *
 * @param instance Passport instance with STRATEGY_NAME already registered
 * @param req Incoming Next.js request
 * @returns The authenticated user, or a falsy value when authentication fails
 */
const authenticate = (
  instance: AuthenticatorLike,
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
      STRATEGY_NAME,
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
 * Per-request login factory (recommended path).
 *
 * Builds a fresh `Passport()` instance and registers a freshly-built strategy
 * on it for every request, then authenticates and seals the session. Because no
 * process-global state is mutated, this path is immune to the AIR-201 singleton
 * hazards (cold-start loss, multi-tenant clobber, dev HMR re-registration) and
 * cannot suffer a "strategy not registered" footgun — registration is intrinsic
 * to the closure.
 *
 * @param findUser Resolve a user from the parsed request body
 * @param validatePassword Return true when the body credentials match the user
 * @returns An async login handler `(req) => Promise<void>` that seals the session on success
 */
export const createLogin =
  (findUser: FindUser, validatePassword: ValidatePassword) =>
  async (req: NextRequest): Promise<void> => {
    const instance = new passport.Passport()
    instance.use(STRATEGY_NAME, buildLocalStrategy(findUser, validatePassword))

    const user = await authenticate(instance, req)
    if (!user) throw new Error(errors.invalidAuthentication)

    const session = { ...user }
    await setSession(session)
  }

/**
 * Legacy login against the global Passport singleton (kept for backward
 * compatibility with `setLocalStrategy` + `APILoginRoute`).
 *
 * Fails fast with an actionable error when the strategy was never registered in
 * this process, rather than surfacing the opaque `Unknown authentication
 * strategy` as a generic `{ ok: false }`. The previous no-op
 * `passport.initialize()` call was removed: with `{ session: false }` and a
 * custom callback its returned middleware was never run, so it was dead code.
 *
 * @param req Incoming Next.js request
 */
const login = async (req: NextRequest): Promise<void> => {
  if (!hasLocalStrategy()) throw new Error(errors.strategyNotRegistered)

  const user = await authenticate(passport, req)
  if (!user) throw new Error(errors.invalidAuthentication)

  const session = { ...user }
  await setSession(session)
}

export default login
