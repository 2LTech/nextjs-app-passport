import { errors } from '@/defs'

/**
 * Generic, client-safe message returned for any unexpected failure.
 *
 * Used so that raw internal error text (crypto, config, or consumer strategy
 * details) is never serialized into an API response body.
 */
export const internalErrorMessage = 'Internal server error'

/**
 * HTTP status code for any unrecognized/unexpected server-side failure.
 */
const INTERNAL_ERROR_STATUS = 500

/**
 * Map of known, client-safe error messages to the HTTP status code that best
 * describes them.
 *
 * - `401` (Unauthorized): invalid credentials, or a missing/expired session —
 *   an authentication problem the caller can reason about.
 * - `500` (Internal Server Error): a re-issue failure during session refresh,
 *   which is a server-side crypto/config problem rather than an auth problem.
 *
 * Any message not listed here is treated as an unexpected failure and reported
 * as a generic `500`, so internal detail is never reflected to the client.
 */
const statusByError: Record<string, number> = {
  [errors.tokenNotFound]: 401,
  [errors.sessionExpired]: 401,
  [errors.invalidAuthentication]: 401,
  [errors.invalidLogin]: 401,
  [errors.refreshFailed]: INTERNAL_ERROR_STATUS
}

/**
 * Build a safe JSON error response for an API route handler.
 *
 * The full error is always logged server-side via `console.error` and never
 * returned verbatim to the client. Known, client-safe errors (the `errors`
 * constants in `@/defs`) keep their stable message and a mapped HTTP status
 * (e.g. `401` for auth/session failures); any unrecognized error is reported as
 * a generic `500` so that internal error detail cannot leak.
 *
 * @param err Caught error (any thrown value)
 * @returns Response with body `{ ok: false, err }` and a non-200 status code
 */
export const errorResponse = (err: unknown): Response => {
  // Keep full detail server-side only.
  console.error(err)

  const message = err instanceof Error ? err.message : String(err)
  const status = statusByError[message]

  // Known safe error: keep its stable message and mapped status.
  if (status) {
    return Response.json({ ok: false, err: message }, { status })
  }

  // Unexpected failure: generic message + 500, never echo the raw error.
  return Response.json(
    { ok: false, err: internalErrorMessage },
    { status: INTERNAL_ERROR_STATUS }
  )
}
