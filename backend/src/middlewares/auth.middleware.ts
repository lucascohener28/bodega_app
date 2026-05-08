import { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { verifyAuthToken } from '../utils/jwt'

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no enviado' })
    }

    const token = authorization.replace('Bearer ', '').trim()
    const payload = verifyAuthToken(token)

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        username: true,
        rol: true,
        activo: true,
      },
    })

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no autorizado' })
    }

    req.user = {
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido o expirado' })
  }
}
