import { NextRequest } from 'next/server'

import { removeCookie } from '@/lib/session'
import { guard } from '@/lib/api/security'
import { errorResponse } from '@/lib/api/response'

/**
 * Logout route
 * @param request API request
 * @returns API Response
 */
export const logoutRoute = async (request: NextRequest): Promise<Response> => {
  try {
    const rejection = guard(request)
    if (rejection) return rejection

    await removeCookie()

    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
