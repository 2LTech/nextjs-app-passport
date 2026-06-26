import { errors } from '@/defs'

// Internal error
export const internalErrorMessage = 'Internal server error'
export const internalErrorStatus = 500

// Unauthorized error
export const unauthorizedErrorStatus = 401

// Status by error
const statusByError: { [key: string]: number } = {
  [errors.tokenNotFound]: unauthorizedErrorStatus,
  [errors.sessionExpired]: unauthorizedErrorStatus,
  [errors.invalidAuthentication]: unauthorizedErrorStatus,
  [errors.invalidLogin]: unauthorizedErrorStatus,
  [errors.refreshFailed]: internalErrorStatus
}

export const errorResponse = (err: unknown): Response => {
  // Keep server-side detail
  console.error(err)

  // Message & status
  const message = err instanceof Error ? err.message : String(err)
  const status = statusByError[message]

  // Known error
  if (status) return Response.json({ ok: false, err: message }, { status })

  // Unexpected failure
  return Response.json(
    { ok: false, err: internalErrorMessage },
    { status: internalErrorStatus }
  )
}
