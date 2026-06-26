import { NextRequest } from 'next/server'

import { errors } from '@/defs'

/**
 * Is same origin
 * @param request Request
 * @returns true when the request may proceed
 */
export const isSameOrigin = (request: NextRequest): boolean => {
  const secFetchSite = request.headers.get('sec-fetch-site')

  // Trust only same-origin or direct user action
  if (secFetchSite === 'same-origin' || secFetchSite === 'none') return true
  if (secFetchSite === 'cross-site') return false

  // same-site and unknown metadata require exact origin/host match
  const origin = request.headers.get('origin')
  // Only allow null origin and null secFetchSite -> server-to-server or native client call
  if (!origin) return !secFetchSite

  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host) return false

  try {
    return new URL(origin).host === host
  } catch {
    // Malformated origin header
    return false
  }
}

/**
 * Guard
 * @param request Request
 * @returns
 */
export const guard = (request: NextRequest): Response | null => {
  // Reject non-POST
  if (request.method !== 'POST')
    return Response.json(
      { ok: false, err: errors.methodNotAllowed },
      { status: 405, headers: { Allow: 'POST' } }
    )

  // Anti CSRF
  if (!isSameOrigin(request))
    return Response.json(
      { ok: false, err: errors.invalidOrigin },
      { status: 403 }
    )

  return null
}
