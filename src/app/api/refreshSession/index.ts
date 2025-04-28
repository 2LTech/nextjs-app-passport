import { refreshSession } from '@/lib/session'

/**
 * Refresh session route
 * @returns API Response
 */
export const refreshSessionRoute = async (): Promise<Response> => {
  try {
    await refreshSession()

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return Response.json({ ok: false, err: err.message })
  }
}
