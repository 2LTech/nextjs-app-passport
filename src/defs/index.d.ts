/**
 * Session interface
 *
 * Unknown keys are typed `unknown` so consumers must narrow them; flow a
 * concrete user type through `getSession<TUser>()` to type known fields.
 */
export interface Session {
  id: string
  [key: string]: unknown
}
