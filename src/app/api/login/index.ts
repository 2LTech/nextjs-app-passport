import { NextRequest } from 'next/server'

import login from '@/lib/login'
import { guard } from '@/lib/api/security'
import { errorResponse } from '@/lib/api/response'

/**
 * Login route
 * @param request API Request
 * @returns API response
 */
export const loginRoute = async (request: NextRequest): Promise<Response> => {
  try {
    const rejection = guard(request)
    if (rejection) return rejection

    await login(request)

    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
