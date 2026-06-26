import { NextRequest } from 'next/server'

import login from '@/lib/login'
import { errorResponse } from '@/lib/api/response'

/**
 * Login route
 * @param req API Request
 * @returns API response
 */
export const loginRoute = async (req: NextRequest): Promise<Response> => {
  try {
    await login(req)

    return Response.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
