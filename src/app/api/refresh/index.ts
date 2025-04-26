import { refreshSession } from '@/lib/session'

/**
 * Refresh route
 * @returns API Response
 */
export const refreshRoute = async (): Promise<Response> => {
  try {
    await refreshSession()

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return Response.json({ ok: false, err: err.message })
  }
}
