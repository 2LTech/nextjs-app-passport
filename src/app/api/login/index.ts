import { NextRequest } from 'next/server'

import createLogin from '@/lib/login'
import { guard } from '@/lib/api/security'
import { errorResponse } from '@/lib/api/response'
import { FindUser, ValidatePassword } from '@/lib/strategy'

/**
 * Create login route
 *
 * Mount as `export const POST = createLoginRoute(findUser, validatePassword)`.
 * @param findUser findUser function
 * @param validatePassword validatePassord Function
 * @returns
 */
export const createLoginRoute =
  (findUser: FindUser, validatePassword: ValidatePassword) =>
  async (request: NextRequest): Promise<Response> => {
    try {
      const rejection = guard(request)
      if (rejection) return rejection

      await createLogin(findUser, validatePassword)(request)

      return Response.json({ ok: true })
    } catch (err) {
      return errorResponse(err)
    }
  }
