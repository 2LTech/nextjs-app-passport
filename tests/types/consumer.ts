/**
 * Consumer-side type fixture for the PUBLISHED `index.d.ts`.
 *
 * `package.json` ships `"types": "./index.d.ts"`, but the Jest suite runs
 * through babel-jest, which strips types WITHOUT type-checking — so an invalid
 * published declaration (missing export, wrong signature, broken type) would
 * never fail the suite even though it breaks every downstream consumer.
 *
 * This file imports the published declarations exactly as a consumer's
 * bundler resolves the `types` entry, and is type-checked (never emitted or
 * executed) by `yarn typecheck:types` with `skipLibCheck: false`. Any
 * regression in `index.d.ts` therefore fails the pipeline. The usage mirrors
 * the published declaration surface (not the runtime), since that is what a
 * downstream `tsc` actually sees.
 */
import NextjsAppPassport, {
  APICreateLoginRoute,
  APILogoutRoute,
  APIRefreshSessionRoute,
  getSession,
  type FindUser,
  type ValidatePassword,
  type Session
} from '../../index'

// The login route is built from the consumer's auth callbacks.
const findUser: FindUser = async (body: any) => body
const validatePassword: ValidatePassword = (_user: any, _body: any) => true
const login: Promise<Response> = APICreateLoginRoute(findUser, validatePassword)

// Logout / refresh take no arguments and resolve to a Response.
const logout: () => Promise<Response> = APILogoutRoute
const refresh: () => Promise<Response> = APIRefreshSessionRoute

// getSession resolves to a Session whose `id` is a string.
async function readId(): Promise<string> {
  const session: Session = await getSession()
  return session.id
}

// The default export bundles the same surface.
const viaDefault: Promise<Response> = NextjsAppPassport.APICreateLoginRoute(
  findUser,
  validatePassword
)

// Reference every binding so the fixture is a self-contained, used module.
export const __fixture = {
  login,
  logout,
  refresh,
  readId,
  viaDefault,
  defaultExport: NextjsAppPassport
}
