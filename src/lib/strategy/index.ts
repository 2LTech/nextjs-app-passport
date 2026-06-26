import { NextRequest } from 'next/server'
import passport from 'passport'
import Custom from 'passport-custom'

import { errors } from '@/defs'

// Types

/**
 * Locate a user from the parsed login request body.
 *
 * The body is typed `unknown` on purpose: consumers must narrow/validate it
 * before trusting its shape.
 *
 * @typeParam TUser - Shape of the user record your application stores.
 * @param body Parsed JSON request body.
 * @returns The matching user, or `null`/`undefined` when none is found.
 */
export type FindUser<TUser = unknown> = (
  body: unknown
) => Promise<TUser | null | undefined>

/**
 * Validate a candidate password against a user record.
 *
 * @typeParam TUser - Shape of the user record your application stores.
 * @param user User returned by {@link FindUser}.
 * @param body Parsed JSON request body.
 * @returns `true` when the credentials are valid.
 */
export type ValidatePassword<TUser = unknown> = (
  user: TUser,
  body: unknown
) => boolean

/**
 * Set local strategy
 * @typeParam TUser - Shape of the user record your application stores.
 * @param findUser findUser function
 * @param validatePassword validatePassword function
 */
export const setLocalStrategy = <TUser = unknown>(
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
