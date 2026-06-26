import { removeCookie } from '@/lib/session'
import { errorResponse } from '@/lib/api/response'

/**
 * Logout route
 * @returns API Response
 */
export const logoutRoute = async (): Promise<Response> => {
  try {
    await removeCookie()

    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
