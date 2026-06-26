import Iron from '@hapi/iron'
import { cookies } from 'next/headers'
import { randomBytes } from 'node:crypto'

import { Session } from '@/defs/index.d'
import {
  errors,
  MAX_AGE,
  TOKEN_NAME,
  TOKEN_SECRET,
  SECURE_COOKIE,
  ABSOLUTE_MAX_AGE
} from '@/defs'

// Iron options
const ironOptions = {
  ...Iron.defaults,
  ttl: MAX_AGE * 1_000 // ms
}

/**
 * Set cookie
 * @param token Token
 */
export const setCookie = async (token: string) => {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, token, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1_000),
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
 * Compute session expiry time
 * @param session Session
 * @returns Expiry
 */
export const sessionExpireAt = (session: Session): number => {
  const createAt = +session.createdAt
  const maxAge = +session.maxAge
  if (!Number.isFinite(createAt) || !Number.isFinite(maxAge)) return 0

  const issuedAtRaw = +session.issuedAt
  const issuedAt = Number.isFinite(issuedAtRaw) ? issuedAtRaw : createAt

  const slidingExpiry = createAt + maxAge * 1_000 //ms
  const absoluteExpiry = issuedAt + ABSOLUTE_MAX_AGE * 1_000 //ms

  return Math.min(slidingExpiry, absoluteExpiry)
}

/**
 * Get session
 * @returns Session
 */
export const getSession = async (): Promise<Session> => {
  const token = await getCookie()
  if (!token) throw new Error(errors.tokenNotFound)

  // Descrupt session data
  const session = await Iron.unseal(token, TOKEN_SECRET, ironOptions)

  // Validate lifetime
  if (Date.now() > sessionExpireAt(session)) {
    throw new Error(errors.sessionExpired)
  }

  return session
}

/**
 * Set session
 * @param session Session
 */
export const setSession = async (session: Session) => {
  const createdAt = Date.now()
  const obj = { ...session, createdAt, issuedAt: createdAt, maxAge: MAX_AGE }
  const token = await Iron.seal(obj, TOKEN_SECRET, ironOptions)

  await setCookie(token)
}

/**
 * Refresh session
 */
export const refreshSession = async () => {
  // Enforce lifetime before re-issuing a new token
  const session = await getSession()

  try {
    // Generate a new CSRF token
    const newCsrfToken = randomBytes(32).toString('hex')

    // Preserve absolute max age
    const issuedAtRaw = Number(session.issuedAt)
    const issuedAt = Number.isFinite(issuedAtRaw)
      ? issuedAtRaw
      : Number(session.createdAt)

    // Create a new session
    const newSession = {
      ...session,
      csrfToken: newCsrfToken,
      createdAt: Date.now(),
      issuedAt
    }

    // Encrypt the new session data
    const newToken = await Iron.seal(newSession, TOKEN_SECRET, ironOptions)

    // Set the new session cookie
    await setCookie(newToken)
  } catch (err) {
    console.error(errors.refreshFailed, err)
    throw new Error(errors.refreshFailed)
  }
}
