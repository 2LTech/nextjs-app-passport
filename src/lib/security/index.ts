import { NextRequest } from 'next/server'

import { errors } from '@/defs'

/**
 * Decide whether a request is same-origin / same-site (i.e. not a cross-site
 * CSRF vector).
 *
 * The auth cookie is `SameSite=Lax`, which is still attached to cross-site
 * *top-level* navigations and prefetches, so cookie presence alone does not
 * prove the request was initiated by our own site. We therefore inspect the
 * request origin:
 *
 * 1. Prefer the browser-set `Sec-Fetch-Site` Fetch Metadata header. It cannot
 *    be forged by cross-site script, so it is the most reliable signal. Only
 *    `cross-site` is treated as hostile; `same-origin` / `same-site` are
 *    trusted and `none` is a direct user action (typed URL, bookmark).
 * 2. Fall back to comparing the `Origin` header host against the request
 *    `Host` (`X-Forwarded-Host` when proxied) for clients that do not send
 *    Fetch Metadata.
 * 3. When neither header is present the request is not a browser-driven CSRF
 *    attempt (e.g. a server-to-server or native client call), so we fail open.
 *
 * @param req Incoming request
 * @returns true when the request may proceed, false when it is cross-site
 */
export const isSameOrigin = (req: NextRequest): boolean => {
  const secFetchSite = req.headers.get('sec-fetch-site')
  if (secFetchSite) return secFetchSite !== 'cross-site'

  const origin = req.headers.get('origin')
  // No Fetch Metadata and no Origin → not a browser CSRF request: fail open
  if (!origin) return true

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!host) return false

  try {
    return new URL(origin).host === host
  } catch {
    // Malformed Origin header
    return false
  }
}

/**
 * Guard a state-changing route. Enforces that the request is a same-origin
 * POST and returns the matching error `Response` when it is not, or `null`
 * when the request is allowed to proceed.
 *
 * Used by the logout and refresh routes (see AIR-196) so that these
 * state-changing endpoints are no longer reachable through cross-site GET
 * navigations or prefetches.
 *
 * @param req Incoming request
 * @returns A 405/403 `Response` to short-circuit the handler, or `null` to continue
 */
export const guardStateChange = (req: NextRequest): Response | null => {
  // Reject non-POST: state-changing operations must not be served over GET
  if (req.method !== 'POST') {
    return Response.json(
      { ok: false, err: errors.methodNotAllowed },
      { status: 405, headers: { Allow: 'POST' } }
    )
  }

  // Anti-CSRF: reject cross-site requests
  if (!isSameOrigin(req)) {
    return Response.json(
      { ok: false, err: errors.invalidOrigin },
      { status: 403 }
    )
  }

  return null
}
