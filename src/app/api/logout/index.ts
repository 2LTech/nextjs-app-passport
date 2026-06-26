import { NextRequest } from 'next/server'

import { removeCookie } from '@/lib/session'
import { guardStateChange } from '@/lib/security'

/**
 * Logout route
 *
 * State-changing: served over POST and protected against cross-site requests
 * (see AIR-196). Non-POST or cross-site requests are rejected before the auth
 * cookie is removed.
 *
 * @param req API Request
 * @returns API Response
 */
export const logoutRoute = async (req: NextRequest): Promise<Response> => {
  try {
    const rejection = guardStateChange(req)
    if (rejection) return rejection

    await removeCookie()

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return Response.json({ ok: false, err: err.message })
  }
}
