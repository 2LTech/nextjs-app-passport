import { removeCookie } from '@/lib/session'

/**
 * Logout route
 * @returns API Response
 */
export const GET = async (): Promise<Response> => {
  try {
    await removeCookie()

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return Response.json({ ok: false, err: err.message })
  }
}
