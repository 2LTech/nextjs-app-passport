import { NextRequest } from 'next/server'
import passport from 'passport'
import Custom from 'passport-custom'

export type FindUser = (body: any) => Promise<{ user?: any }>
export type ValidatePassword = (user: any, password: string) => boolean

/**
 * Set local strategy
 * @param findUser findUser function
 * @param validatePassword validatePassword function
 */
export const setLocaLStrategy = (
  findUser: FindUser,
  validatePassword: ValidatePassword
) => {
  const localStrategy = new Custom.Strategy((req, done) => {
    const nextRequest = req as unknown as NextRequest
    nextRequest
      .json()
      .then((res) => {
        const { username, password } = res
        findUser({ username })
          .then((user: any) => {
            if (user && validatePassword(user, password)) {
              done(null, user)
            } else {
              done(new Error('Invalid username and password combination'))
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

  passport.use('next-app-passport', localStrategy)
}
