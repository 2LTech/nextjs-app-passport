/**
 * Session interface
 *
 * Holds the serialized (projected) user that is sealed into the cookie and
 * returned by getSession. Credential material (hash, salt, password, ...) is
 * stripped by the strategy's serializeUser hook before a value reaches here.
 */
export interface Session {
  id: string
  [key: string]: any
}
