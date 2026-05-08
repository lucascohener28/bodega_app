import { Router } from 'express'
import { prisma } from '../../config/prisma'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { comparePassword } from '../../utils/password'
import { signAuthToken } from '../../utils/jwt'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim()
    const password = String(req.body.password || '')

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son obligatorios' })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { username },
    })

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales invalidas' })
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario inactivo' })
    }

    const passwordValido = await comparePassword(password, usuario.password)

    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales invalidas' })
    }

    const token = signAuthToken({
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
    })

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al iniciar sesion' })
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        nombre: true,
        username: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json(usuario)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener usuario autenticado' })
  }
})

export default router
