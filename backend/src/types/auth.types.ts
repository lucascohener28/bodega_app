import { Rol } from '@prisma/client'

export type AuthUser = {
  id: string
  username: string
  rol: Rol
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}
