import Iron from '@hapi/iron'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

import { Session } from '@/defs/index.d'
import { errors, MAX_AGE, TOKEN_NAME, TOKEN_SECRET } from '@/defs'

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
    secure: process.env.NODE_ENV === 'production',
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
export const setSession = async (session: Session) => {
  const createdAt = Date.now()
  const obj = { ...session, createdAt, maxAge: MAX_AGE }
  const token = await Iron.seal(obj, TOKEN_SECRET, Iron.defaults)

  await setCookie(token)
}

/**
 * Get session
 * @returns Session
 */
export const getSession = async (): Promise<Session> => {
  const token = await getCookie()
  if (!token) throw new Error(errors.tokenNotFound)

  // Decrypt session data
  const session = await Iron.unseal(token, TOKEN_SECRET, Iron.defaults)
  const expiresAt = session.createdAt + session.maxAge * 1000

  // Validate the expiration date of the session
  if (Date.now() > expiresAt) {
    throw new Error(errors.sessionExpired)
  }

  return session
}

/**
 * Refresh session
 */
export const refreshSession = async () => {
  const token = await getCookie()
  if (!token) throw new Error(errors.tokenNotFound)

  try {
    // Decrypt session data
    const session = await Iron.unseal(token, TOKEN_SECRET, Iron.defaults)

    // Generate a new CSRF token
    const newCsrfToken = randomBytes(32).toString('hex')

    // Create a new session
    const newSession = {
      ...session,
      csrfToken: newCsrfToken,
      createdAt: Date.now()
    }

    // Encrypt the new session data
    const newToken = await Iron.seal(newSession, TOKEN_SECRET, Iron.defaults)

    // Set the new session cookie
    setCookie(newToken)
  } catch (err) {
    console.error(errors.refreshFailed, err)
    throw new Error(errors.refreshFailed)
  }
}
