import { NextRequest } from 'next/server'

import { guard } from '@/lib/api/security'
import { errorResponse } from '@/lib/api/response'
import logout from '@/lib/logout'

/**
 * Logout route
 * @param request API request
 * @returns API Response
 */
export const logoutRoute = async (request: NextRequest): Promise<Response> => {
  try {
    const rejection = guard(request)
    if (rejection) return rejection

    await logout()

    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
