import { refreshSession } from '@/lib/session'
import { errorResponse } from '@/lib/api/response'

/**
 * Refresh session route
 * @returns API Response
 */
export const refreshSessionRoute = async (): Promise<Response> => {
  try {
    await refreshSession()

    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
