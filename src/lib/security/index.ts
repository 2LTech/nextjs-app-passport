import { NextRequest } from 'next/server'

import { errors } from '@/defs'

/**
 * Decide whether a request is same-origin (i.e. not a CSRF vector).
 *
 * The auth cookie is `SameSite=Lax`, which is still attached to cross-site
 * *top-level* navigations and prefetches, so cookie presence alone does not
 * prove the request was initiated by our own origin. We therefore inspect the
 * request origin:
 *
 * 1. Prefer the browser-set `Sec-Fetch-Site` Fetch Metadata header (it cannot
 *    be forged by cross-site script):
 *    - `same-origin` → trusted (our own origin).
 *    - `none` → a direct user action (typed URL, bookmark) with no cross-site
 *      initiator, so it is not a CSRF vector.
 *    - `cross-site` → rejected.
 *    - `same-site` (a sibling origin under the same registrable domain, which
 *      may be attacker-controlled) and any unknown value are NOT trusted on
 *      their own: they fall through to the exact `Origin`/`Host` check below.
 *      Same-site is not the same as same-origin.
 * 2. Fall back to comparing the `Origin` header host against the request
 *    `Host` (`X-Forwarded-Host` when proxied) for `same-site` / unknown
 *    metadata and for clients that do not send Fetch Metadata.
 * 3. When neither the metadata nor an `Origin` header is present the request
 *    is not a browser-driven CSRF attempt (e.g. a server-to-server or native
 *    client call), so we fail open.
 *
 * @param req Incoming request
 * @returns true when the request may proceed, false when it is cross-origin
 */
export const isSameOrigin = (req: NextRequest): boolean => {
  const secFetchSite = req.headers.get('sec-fetch-site')

  // Trust only an explicit same-origin request or a direct user action.
  if (secFetchSite === 'same-origin' || secFetchSite === 'none') return true

  // The clear CSRF vector.
  if (secFetchSite === 'cross-site') return false

  // `same-site` and unknown/absent metadata require an exact Origin/Host match.
  const origin = req.headers.get('origin')
  // Fail open only when there is no signal at all (no Fetch Metadata AND no
  // Origin) — e.g. a server-to-server or native client call. When Fetch
  // Metadata is present but untrusted (`same-site` / unknown), a missing
  // Origin cannot be validated, so it is rejected.
  if (!origin) return !secFetchSite

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

  // Anti-CSRF: reject requests that are not same-origin
  if (!isSameOrigin(req)) {
    return Response.json(
      { ok: false, err: errors.invalidOrigin },
      { status: 403 }
    )
  }

  return null
}
