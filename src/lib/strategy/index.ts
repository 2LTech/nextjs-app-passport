import { NextRequest } from 'next/server'
import passport from 'passport'
import Custom from 'passport-custom'

import { errors } from '@/defs'

// Types
export type FindUser = (body: any) => Promise<any>
export type ValidatePassword = (user: any, body: any) => boolean

// Canonical strategy name. Shared with the login flow so the registration and
// the `authenticate(...)` call can never drift apart (no duplicated literal).
export const STRATEGY_NAME = 'next-app-passport'

/**
 * Build a passport-custom strategy from the caller's user-lookup and
 * password-check functions.
 *
 * Pure factory: each call returns a *fresh* `Custom.Strategy` and does NOT
 * mutate any global Passport state. That is what lets the login flow register
 * it on a per-request `Passport()` instance and avoid the process-global
 * singleton hazards described in AIR-201 (cold-start loss, multi-tenant
 * clobber, dev HMR re-registration).
 *
 * @param findUser Resolve a user from the parsed request body, or a falsy value when none matches
 * @param validatePassword Return true when the body credentials match the resolved user
 * @returns A `Custom.Strategy` that calls `done(null, user)` on success and `done(err)` otherwise
 */
export const buildLocalStrategy = (
  findUser: FindUser,
  validatePassword: ValidatePassword
): Custom.Strategy =>
  new Custom.Strategy((req, done) => {
    const nextRequest = req as unknown as NextRequest
    nextRequest
      .json()
      .then((res) => {
        findUser(res)
          .then((user: any) => {
            if (user && validatePassword(user, res)) {
              done(null, user)
            } else {
              done(new Error(errors.invalidLogin))
            }
          })
          .catch((err: any) => {
            done(err)
          })
      })
      .catch((err) => {
        done(err)
      })
  })

/**
 * Register the local strategy on the process-global Passport singleton.
 *
 * Legacy/global path, kept for backward compatibility with consumers that wire
 * `setLocalStrategy(...)` + `APILoginRoute` together. Because it mutates the one
 * shared Passport slot it remains subject to the singleton hazards of AIR-201
 * (the registration can be lost on a serverless cold start, or clobbered by a
 * second tenant/route registering a different strategy under the same name).
 *
 * Prefer `createLoginRoute(findUser, validatePassword)` for new code: it builds
 * a per-request Passport instance and is immune to those hazards.
 *
 * @param findUser see {@link buildLocalStrategy}
 * @param validatePassword see {@link buildLocalStrategy}
 */
export const setLocalStrategy = (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => {
  passport.use(STRATEGY_NAME, buildLocalStrategy(findUser, validatePassword))
}

/**
 * Report whether the local strategy is currently registered on the global
 * Passport singleton.
 *
 * Reads Passport's internal `_strategy(name)` lookup (not part of the public
 * `@types/passport` surface, hence the cast) because that registry is the exact
 * source of truth for whether a subsequent `authenticate(STRATEGY_NAME, ...)`
 * would succeed or throw the opaque `Unknown authentication strategy`. The
 * legacy `login` flow uses this to fail fast with an actionable setup error.
 *
 * @returns true when `setLocalStrategy` (or an equivalent `passport.use`) has run in this process
 */
export const hasLocalStrategy = (): boolean => {
  const registry = passport as unknown as {
    _strategy?: (name: string) => unknown
  }
  return Boolean(registry._strategy?.(STRATEGY_NAME))
}
