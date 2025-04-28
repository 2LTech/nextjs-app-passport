import { getSession } from '@/lib/session'

/**
 * Get session route
 * @returns API response
 */
export const getSessionRoute = async (): Promise<Response> => {
  try {
    const session = await getSession()

    return Response.json({ ok: true, data: session })
  } catch (err: any) {
    console.error(err)
    return Response.json({ ok: false, err: err.message })
  }
}
