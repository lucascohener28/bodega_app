import { Rol } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'

export function roleMiddleware(roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta accion' })
    }

    next()
  }
}
