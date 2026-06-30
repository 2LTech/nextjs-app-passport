import { removeCookie } from '../session'

const logout = async () => {
  await removeCookie()
}

export default logout
