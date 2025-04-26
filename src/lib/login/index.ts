import { NextRequest } from 'next/server'
import passport from 'passport'

import { errors } from '@/defs'
import { setSession } from '@/lib/session'

/**
 * Authenticate
 * @param req Request
 * @returns Token
 */
const authenticate = (req: NextRequest): Promise<any> =>
  new Promise((resolve, reject) => {
    passport.authenticate(
      'next-app-passport',
      { session: false },
      (err: Error, user: any) => {
        if (err) reject(err)
        else resolve(user)
      }
    )(req)
  })

/**
 * Login
 * @param req Request
 */
const login = async (req: NextRequest) => {
  passport.initialize()

  const user = await authenticate(req)
  if (!user) throw new Error(errors.invalidAuthentication)

  const session = { ...user }
  await setSession(session)
}

export default login
