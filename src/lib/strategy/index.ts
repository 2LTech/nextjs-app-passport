import { NextRequest } from 'next/server'
import passport from 'passport'
import Custom from 'passport-custom'

import { errors } from '@/defs'

// Types
export type FindUser = (body: any) => Promise<any>
export type ValidatePassword = (user: any, body: any) => boolean

export const strategyName = 'nextjs-app-passport'

/**
 * Build custom strategy
 * @param findUser findUser function
 * @param validatePassword validatePassword function
 */
export const buildCustomStrategy = (
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
