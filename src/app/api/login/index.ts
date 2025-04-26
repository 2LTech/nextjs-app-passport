import { NextRequest } from 'next/server'

import login from '@/lib/login'

/**
 * Login route
 * @param req API Request
 * @returns API response
 */
export const loginRoute = async (req: NextRequest): Promise<Response> => {
  try {
    await login(req)

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return Response.json({ ok: false, err: err.message })
  }
}
