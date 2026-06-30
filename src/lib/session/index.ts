import Iron from '@hapi/iron'
import { cookies } from 'next/headers'

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
 * Set session
 * @param session Session
 */
export const setSession = async (session: Partial<Session>) => {
  const createdAt = Date.now()
  const obj = {
    ...session,
    createdAt,
    issuedAt: createdAt,
    maxAge: MAX_AGE
  }
  const token = await Iron.seal(obj, TOKEN_SECRET, ironOptions)

  await setCookie(token)
}

/**
 * Compute session expiry time
 * @param session Session
 * @returns Expiry
 */
export const sessionExpireAt = (session: Session): number => {
  const createAt = Number(session.createdAt)
  const maxAge = Number(session.maxAge)
  if (!Number.isFinite(createAt) || !Number.isFinite(maxAge)) return 0

  const issuedAtRaw = Number(session.issuedAt)
  const issuedAt = Number.isFinite(issuedAtRaw) ? issuedAtRaw : createAt

  const slidingExpiry = createAt + maxAge * 1_000 //ms
  const absoluteExpiry = issuedAt + ABSOLUTE_MAX_AGE * 1_000 //ms

  return Math.min(slidingExpiry, absoluteExpiry)
}

/**
 * Is Session (assertion function)
 * @param session Session
 */
export function isSession(session: unknown): asserts session is Session {
  if (
    !session ||
    !(session as Session).id ||
    (session as Session).createdAt === undefined ||
    (session as Session).issuedAt === undefined ||
    (session as Session).maxAge === undefined
  )
    throw new Error(errors.invalidSession)
}

/**
 * Get session
 * @param additionalData Additional data to return
 * @returns Session
 */
export const getSession = async (
  additionalData?: string[]
): Promise<Session> => {
  const token = await getCookie()
  if (!token) throw new Error(errors.tokenNotFound)

  // Decrypt session data
  const session = await Iron.unseal(token, TOKEN_SECRET, ironOptions)

  // Check session
  isSession(session)

  // Validate lifetime
  if (Date.now() > sessionExpireAt(session)) {
    throw new Error(errors.sessionExpired)
  }

  // Session
  const toReturn: Session = {
    id: session.id,
    createdAt: session.createdAt,
    issuedAt: session.issuedAt,
    maxAge: session.maxAge
  }
  additionalData?.forEach((d) => (toReturn[d] = session[d]))
  return toReturn
}

/**
 * Refresh session
 */
export const refreshSession = async () => {
  // Enforce lifetime before re-issuing a new token
  const session = await getSession()

  try {
    // Preserve absolute max age
    const issuedAtRaw = Number(session.issuedAt)
    const issuedAt = Number.isFinite(issuedAtRaw)
      ? issuedAtRaw
      : Number(session.createdAt)

    // Create a new session
    const newSession = {
      ...session,
      createdAt: Date.now(),
      issuedAt
    }

    // Encrypt the new session data
    const newToken = await Iron.seal(newSession, TOKEN_SECRET, ironOptions)

    // Set the new session cookie
    await setCookie(newToken)
  } catch (err) {
    console.error(errors.refreshFailed, err)
    throw new Error(errors.refreshFailed, { cause: err })
  }
}
