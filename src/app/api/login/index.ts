import { NextRequest } from 'next/server'

import createLogin from '@/lib/login'
import { guard } from '@/lib/api/security'
import { errorResponse } from '@/lib/api/response'
import { FindUser, SerializeUser, ValidatePassword } from '@/lib/strategy'

/**
 * Create login route
 *
 * Mount as `export const POST = createLoginRoute(findUser, validatePassword)`.
 * @param findUser findUser function
 * @param validatePassword validatePassord Function
 * @param serializeUser Optional projection applied to the authenticated user
 * before it is sealed into the session cookie (see buildCustomStrategy).
 * @returns
 */
export const createLoginRoute =
  (
    findUser: FindUser,
    validatePassword: ValidatePassword,
    serializeUser?: SerializeUser
  ) =>
  async (request: NextRequest): Promise<Response> => {
    try {
      const rejection = guard(request)
      if (rejection) return rejection

      await createLogin(findUser, validatePassword, serializeUser)(request)

      return Response.json({ ok: true })
    } catch (err) {
      return errorResponse(err)
    }
  }
