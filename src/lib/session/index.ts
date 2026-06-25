import Iron from '@hapi/iron'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

import { Session } from '@/defs/index.d'
import {
  errors,
  MAX_AGE,
  ABSOLUTE_MAX_AGE,
  TOKEN_NAME,
  TOKEN_SECRET,
  SECURE_COOKIE
} from '@/defs'

/**
 * Iron seal/unseal options.
 *
 * `Iron.defaults.ttl === 0` means the cryptographic envelope never expires, so
 * a stolen/old token would decrypt forever. We override `ttl` with the
 * per-token sliding window (MAX_AGE, in ms) so the crypto layer enforces a
 * lifetime independently of the in-payload `createdAt`/`maxAge` check. The TTL
 * is reset on every re-seal in `refreshSession`; the absolute lifetime ceiling
 * is enforced separately via the immutable `issuedAt` claim.
 */
const ironOptions = {
  ...Iron.defaults,
  ttl: MAX_AGE * 1000 // ms
}

/**
 * Set cookie
 * @param token Token
 */
export const setCookie = async (token: string) => {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, token, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    httpOnly: true,
    secure: SECURE_COOKIE,
    path: '/',
    sameSite: 'lax'
  })
}

/**
 * Get cookie
 * @returns Cookie
 */
export const getCookie = async (): Promise<string | undefined> => {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_NAME)?.value
}

/**
 * Remove cookie
 */
export const removeCookie = async () => {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_NAME)
}

/**
 * Compute the effective expiry of a decrypted session (ms since epoch).
 *
 * A session is bounded by two independent limits and expires at the EARLIER
 * of the two:
 *  - the sliding per-token window `createdAt + maxAge` (advanced by refresh);
 *  - the absolute ceiling `issuedAt + ABSOLUTE_MAX_AGE` (set at login, never
 *    advanced by refresh) — this is what stops indefinite refreshing.
 *
 * A payload with a missing or non-numeric `createdAt`/`maxAge` is treated as
 * already expired (returns 0) rather than trusted. Legacy tokens predating the
 * `issuedAt` claim fall back to anchoring the absolute ceiling on `createdAt`.
 *
 * @param session Decrypted session payload
 * @returns Expiry as ms since epoch, or 0 when the payload is malformed
 */
const sessionExpiresAt = (session: any): number => {
  const createdAt = Number(session?.createdAt) // ms since epoch
  const maxAge = Number(session?.maxAge) // seconds
  if (!Number.isFinite(createdAt) || !Number.isFinite(maxAge)) return 0

  const issuedAtRaw = Number(session?.issuedAt) // ms since epoch
  const issuedAt = Number.isFinite(issuedAtRaw) ? issuedAtRaw : createdAt

  const slidingExpiry = createdAt + maxAge * 1000 // ms
  const absoluteExpiry = issuedAt + ABSOLUTE_MAX_AGE * 1000 // ms

  return Math.min(slidingExpiry, absoluteExpiry)
}

/**
 * Decrypt the current session cookie and enforce its lifetime.
 *
 * Shared by `getSession` and `refreshSession` so both read paths surface
 * failures identically:
 *  - a missing cookie throws `errors.tokenNotFound`;
 *  - an expired or over-ceiling session throws `errors.sessionExpired`;
 *  - a tampered/undecryptable/Iron-TTL-expired token propagates the raw Iron
 *    error (matching `getSession`'s previous behaviour, rather than the old
 *    `refreshSession` which flattened every cause into `refreshFailed` and
 *    discarded the original error/stack).
 *
 * @returns Decrypted, still-valid session payload
 */
const readValidSession = async (): Promise<Session> => {
  const token = await getCookie()
  if (!token) throw new Error(errors.tokenNotFound)

  // Decrypt session data (raw Iron errors propagate to the caller)
  const session = await Iron.unseal(token, TOKEN_SECRET, ironOptions)

  // Validate lifetime: sliding window AND absolute ceiling
  if (Date.now() > sessionExpiresAt(session)) {
    throw new Error(errors.sessionExpired)
  }

  return session
}

/**
 * Set session
 *
 * Stamps both `createdAt` (sliding window anchor) and `issuedAt` (immutable
 * absolute-lifetime anchor) at initial login.
 * @param session Session
 */
export const setSession = async (session: Session) => {
  const createdAt = Date.now() // ms since epoch
  const obj = { ...session, createdAt, issuedAt: createdAt, maxAge: MAX_AGE }
  const token = await Iron.seal(obj, TOKEN_SECRET, ironOptions)

  await setCookie(token)
}

/**
 * Get session
 * @returns Session
 */
export const getSession = async (): Promise<Session> => {
  return readValidSession()
}

/**
 * Refresh session
 *
 * Re-issues the session with a fresh CSRF token and a slid `createdAt`, but
 * only after re-validating the current session's lifetime (an expired or
 * over-ceiling cookie can no longer be revived). The `issuedAt` anchor is
 * preserved unchanged, so repeated refreshes cannot extend total lifetime past
 * `issuedAt + ABSOLUTE_MAX_AGE`.
 */
export const refreshSession = async () => {
  // Enforce lifetime BEFORE re-issuing (mirrors getSession)
  const session = await readValidSession()

  // Generate a new CSRF token
  const newCsrfToken = randomBytes(32).toString('hex')

  // Preserve the immutable absolute anchor; legacy tokens without `issuedAt`
  // are anchored to their existing `createdAt`.
  const issuedAtRaw = Number(session.issuedAt)
  const issuedAt = Number.isFinite(issuedAtRaw)
    ? issuedAtRaw
    : Number(session.createdAt)

  // Create a new session (slide createdAt, keep issuedAt)
  const newSession = {
    ...session,
    csrfToken: newCsrfToken,
    issuedAt,
    createdAt: Date.now()
  }

  // Encrypt the new session data
  const newToken = await Iron.seal(newSession, TOKEN_SECRET, ironOptions)

  // Set the new session cookie
  await setCookie(newToken)
}
