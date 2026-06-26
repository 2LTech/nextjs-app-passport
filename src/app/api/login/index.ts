import { NextRequest } from 'next/server'

import login, { createLogin } from '@/lib/login'
import { FindUser, ValidatePassword } from '@/lib/strategy'

/**
 * Login route (legacy global-singleton path)
 *
 * Authenticates against the strategy registered via `setLocalStrategy`. Mount as
 * `export const POST = APILoginRoute` and make sure `setLocalStrategy` runs at
 * module load in the same process. Prefer `createLoginRoute` for new code.
 *
 * @param req API Request
 * @returns API response
 */
export const loginRoute = async (req: NextRequest): Promise<Response> => {
  try {
    await login(req)

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return Response.json({ ok: false, err: err.message })
  }
}

/**
 * Login route factory (recommended path)
 *
 * Returns a route handler bound to the given `findUser`/`validatePassword`.
 * Each request builds an isolated per-request Passport instance, so registration
 * is intrinsic to the route and the global-singleton hazards of AIR-201 do not
 * apply. Mount as `export const POST = createLoginRoute(findUser, validatePassword)`.
 *
 * @param findUser Resolve a user from the parsed request body
 * @param validatePassword Return true when the body credentials match the user
 * @returns A route handler `(req) => Promise<Response>`
 */
export const createLoginRoute =
  (findUser: FindUser, validatePassword: ValidatePassword) =>
  async (req: NextRequest): Promise<Response> => {
    try {
      await createLogin(findUser, validatePassword)(req)

      return Response.json({ ok: true })
    } catch (err: any) {
      console.error(err)
      return Response.json({ ok: false, err: err.message })
    }
  }
