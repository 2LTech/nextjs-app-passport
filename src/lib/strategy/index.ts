import { NextRequest } from 'next/server'
import Custom from 'passport-custom'

import { errors } from '@/defs'

// Types
export type MinimalSession = { id: string }
export type FindUser<User extends MinimalSession> = (
  body: unknown
) => Promise<User | null | undefined>
export type ValidatePassword<User extends MinimalSession> = (
  user: User,
  body: unknown
) => boolean

export const strategyName = 'nextjs-app-passport'

/**
 * Build custom strategy
 * @param findUser findUser function
 * @param validatePassword validatePassword function
 */
export const buildCustomStrategy = <User extends MinimalSession>(
  findUser: FindUser<User>,
  validatePassword: ValidatePassword<User>
): Custom.Strategy =>
  new Custom.Strategy((req, done) => {
    const nextRequest = req as unknown as NextRequest
    nextRequest
      .json()
      .then((res) => {
        findUser(res)
          .then((user) => {
            if (user && validatePassword(user, res)) {
              done(null, user)
            } else {
              done(new Error(errors.invalidLogin))
            }
          })
          .catch((err) => {
            done(err)
          })
      })
      .catch((err) => {
        done(err)
      })
  })
