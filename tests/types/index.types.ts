/**
 * Declaration-level type coverage for the published root `index.d.ts`.
 *
 * This file is never executed: it is type-checked with `tsc --noEmit`
 * (`yarn test:types`) to guard the public type surface against regressions.
 * The Jest suite cannot do this because it strips TypeScript types via Babel,
 * and `yarn build` excludes `tests/**` and the hand-maintained `index.d.ts`.
 *
 * The `@ts-expect-error` lines are assertions: `tsc` fails if the expected
 * error disappears, so they actively prove the contract they describe.
 */
import NextjsAppPassport, {
  FindUser,
  ValidatePassword,
  SessionUser,
  Session,
  getSession,
  setLocalStrategy
} from '../../index'

interface User {
  id: string
  username: string
}

// --- setLocalStrategy: explicit generic, with `unknown` request body ---
const findUser: FindUser<User> = async (body) => {
  // @ts-expect-error request body is `unknown`, not `any`; it must be narrowed
  const fromBody: string = body
  void fromBody
  return { id: 'id', username: 'name' }
}
const validatePassword: ValidatePassword<User> = (user, body) => {
  void body
  return user.username.length > 0
}
setLocalStrategy<User>(findUser, validatePassword)

// --- setLocalStrategy: TUser inferred from the callbacks ---
setLocalStrategy(
  async (_body: unknown): Promise<User> => ({ id: 'id', username: 'name' }),
  (_user: User) => true
)

// --- setLocalStrategy: TUser must satisfy SessionUser (a string `id`) ---
// @ts-expect-error a user type without `id: string` is not session-compatible
type BadFindUser = FindUser<{ username: string }>
// Reference the alias so it is not treated as unused documentation.
export type _BadFindUser = BadFindUser

// --- getSession: explicit generic flows custom fields through ---
async function checkGetSession(): Promise<void> {
  const session = await getSession<User>()
  const id: string = session.id
  const username: string = session.username
  void id
  void username

  // Default `TUser = unknown`: unknown keys stay `unknown`.
  const bare = await getSession()
  const baseId: string = bare.id
  void baseId
  // @ts-expect-error unknown-index values are not assignable to `string`
  const unsafe: string = bare.anything
  void unsafe
}
void checkGetSession

// --- Session: `id` is typed, every other key is `unknown` ---
declare const someSession: Session
const sessionId: string = someSession.id
void sessionId
// @ts-expect-error index-signature values are `unknown`, not `string`
const otherField: string = someSession.somethingElse
void otherField

// --- SessionUser is the minimal `{ id: string }` contract ---
const minimal: SessionUser = { id: 'id' }
void minimal

// --- the default export exposes the same callable, generic surface ---
NextjsAppPassport.setLocalStrategy<User>(findUser, validatePassword)
void NextjsAppPassport.getSession
