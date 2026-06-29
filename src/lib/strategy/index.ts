import { NextRequest } from 'next/server'
import Custom from 'passport-custom'

import { errors } from '@/defs'

// Types
export type FindUser = (body: any) => Promise<any>
export type ValidatePassword = (user: any, body: any) => boolean
/**
 * Projects the authenticated user to the object that is sealed into the
 * session cookie (and later returned by getSession). Use it to keep only the
 * non-sensitive claims your app needs in the session.
 */
export type SerializeUser = (user: any) => any

/**
 * Credential / sensitive field names stripped by the default serializer before
 * the user is sealed into the session cookie. Matching is done on a normalized
 * key (lower-cased, with non-alphanumeric separators removed), so `password`,
 * `password_hash`, `passwordHash` and `PASSWORD-HASH` all match.
 */
export const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'hash',
  'passwordhash',
  'hashedpassword',
  'salt',
  'passwordsalt',
  'secret'
]

/** Normalize a key for case/separator-insensitive sensitive-field matching. */
const normalizeKey = (key: string): string =>
  key.toLowerCase().replace(/[^a-z0-9]/g, '')

const sensitiveKeys = new Set(SENSITIVE_FIELDS.map(normalizeKey))

/**
 * Default user serializer (safe-by-default projection).
 *
 * Shallow-copies the authenticated user while dropping well-known **top-level**
 * credential fields (see SENSITIVE_FIELDS), keeping common hash/salt/password
 * columns out of the session cookie and getSession output. This is a deny-list,
 * so it does NOT cover nested objects or sensitive data stored under other field
 * names (e.g. `passwordDigest`, `apiKey`, `{ credentials: { hash } }`). Apps with
 * such data must pass an explicit allow-list serializer for a strong guarantee —
 * do not rely on this default as a categorical filter.
 *
 * @param user Authenticated user returned by findUser
 * @returns Shallow copy with well-known top-level credential fields removed
 */
export const defaultSerializeUser: SerializeUser = (user: any): any => {
  if (!user || typeof user !== 'object') return user

  const safe: Record<string, any> = {}
  for (const [key, value] of Object.entries(user)) {
    if (!sensitiveKeys.has(normalizeKey(key))) safe[key] = value
  }
  return safe
}

export const strategyName = 'nextjs-app-passport'

/**
 * Build custom strategy
 * @param findUser findUser function
 * @param validatePassword validatePassword function
 * @param serializeUser Optional projection applied to the authenticated user
 * before it is sealed into the session cookie. Defaults to defaultSerializeUser,
 * which strips well-known top-level credential fields (hash, salt, password, ...).
 */
export const buildCustomStrategy = (
  findUser: FindUser,
  validatePassword: ValidatePassword,
  serializeUser: SerializeUser = defaultSerializeUser
): Custom.Strategy =>
  new Custom.Strategy((req, done) => {
    const nextRequest = req as unknown as NextRequest
    nextRequest
      .json()
      .then((res) => {
        findUser(res)
          .then((user: any) => {
            if (user && validatePassword(user, res)) {
              // validatePassword has run against the full user (it needs the
              // hash/salt); project here so only the serialized fields reach
              // login/setSession and the cookie — whatever serializeUser drops
              // (credential fields, by default) never flows downstream.
              done(null, serializeUser(user))
            } else {
              done(new Error(errors.invalidLogin))
            }
          })
          .catch((err: any) => {
            done(err)
          })
      })
      .catch((err) => {
        done(err)
      })
  })
