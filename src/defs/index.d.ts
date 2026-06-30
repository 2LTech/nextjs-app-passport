/**
 * Session interface
 */
export interface Session {
  id: string
  createdAt: number
  issuedAt: number
  maxAge: number
  [key: string]: unknown
}
