import { NextRequest } from 'next/server'

import { refreshSession } from '@/lib/session'
import { guard } from '@/lib/api/security'
import { errorResponse } from '@/lib/api/response'

/**
 * Refresh session route
 * @param request API request
 * @returns API Response
 */
export const refreshSessionRoute = async (
  request: NextRequest
): Promise<Response> => {
  try {
    const rejection = guard(request)
    if (rejection) return rejection

    await refreshSession()

    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
