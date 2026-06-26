import { NextRequest } from 'next/server'

import { refreshSession } from '@/lib/session'
import { guardStateChange } from '@/lib/security'

/**
 * Refresh session route
 *
 * State-changing: served over POST and protected against cross-site requests
 * (see AIR-196). Non-POST or cross-site requests are rejected before the
 * session window is slid forward.
 *
 * @param req API Request
 * @returns API Response
 */
export const refreshSessionRoute = async (
  req: NextRequest
): Promise<Response> => {
  try {
    const rejection = guardStateChange(req)
    if (rejection) return rejection

    await refreshSession()

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return Response.json({ ok: false, err: err.message })
  }
}
