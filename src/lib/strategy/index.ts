import { NextRequest } from 'next/server'
import passport from 'passport'
import Custom from 'passport-custom'

import { errors } from '@/defs'

// Types

/**
 * Minimal contract every authenticated user must satisfy.
 *
 * The user returned by {@link FindUser} is persisted as-is into the session
 * (see `@/lib/login`), and a session always exposes a string `id`
 * (`Session.id`). `TUser` is therefore constrained to `{ id: string }` so the
 * strategy side cannot register a user that is incompatible with the base
 * session contract promised by `getSession`.
 */
export type SessionUser = { id: string }

/**
 * Locate a user from the parsed login request body.
 *
 * The body is typed `unknown` on purpose: consumers must narrow/validate it
 * before trusting its shape.
 *
 * @typeParam TUser - Shape of the user record your application stores
 *   (must include a string `id`, see {@link SessionUser}).
 * @param body Parsed JSON request body.
 * @returns The matching user, or `null`/`undefined` when none is found.
 */
export type FindUser<TUser extends SessionUser = SessionUser> = (
  body: unknown
) => Promise<TUser | null | undefined>

/**
 * Validate a candidate password against a user record.
 *
 * @typeParam TUser - Shape of the user record your application stores
 *   (must include a string `id`, see {@link SessionUser}).
 * @param user User returned by {@link FindUser}.
 * @param body Parsed JSON request body.
 * @returns `true` when the credentials are valid.
 */
export type ValidatePassword<TUser extends SessionUser = SessionUser> = (
  user: TUser,
  body: unknown
) => boolean

/**
 * Set local strategy
 *
 * The user `findUser` resolves is stored verbatim in the session, so `TUser`
 * must include a string `id` ({@link SessionUser}) to stay compatible with the
 * base session contract that `getSession` later asserts.
 *
 * @typeParam TUser - Shape of the user record your application stores.
 * @param findUser findUser function
 * @param validatePassword validatePassword function
 */
export const setLocalStrategy = <TUser extends SessionUser = SessionUser>(
  findUser: FindUser<TUser>,
  validatePassword: ValidatePassword<TUser>
) => {
  const localStrategy = new Custom.Strategy((req, done) => {
    const nextRequest = req as unknown as NextRequest
    nextRequest
      .json()
      .then((res: unknown) => {
        findUser(res)
          .then((user) => {
            if (user && validatePassword(user, res)) {
              done(null, user)
            } else {
              done(new Error(errors.invalidLogin))
            }
          })
          .catch((err: unknown) => {
            done(err)
          })
      })
      .catch((err: unknown) => {
        done(err)
      })
  })

  passport.use('next-app-passport', localStrategy)
}
