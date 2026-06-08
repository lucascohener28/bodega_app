import { Router } from 'express'
import { prisma } from '../../config/prisma'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { comparePassword, hashPassword } from '../../utils/password'
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
      select: {
        id: true,
        nombre: true,
        username: true,
        email: true,
        password: true,
        rol: true,
        activo: true,
      },
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
        debeCambiarPassword: false,
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

    res.json({
      ...usuario,
      debeCambiarPassword: false,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener usuario autenticado' })
  }
})

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '')
    const newPassword = String(req.body.newPassword || '')

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password actual y nueva password son obligatorias' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva password debe tener al menos 6 caracteres' })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.id },
    })

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no autorizado' })
    }

    const passwordValido = await comparePassword(currentPassword, usuario.password)

    if (!passwordValido) {
      return res.status(400).json({ error: 'Password actual incorrecta' })
    }

    const updated = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        password: await hashPassword(newPassword),
      },
      select: {
        id: true,
        nombre: true,
        username: true,
        email: true,
        rol: true,
        activo: true,
      },
    })

    res.json({
      message: 'Password actualizada correctamente',
      usuario: {
        ...updated,
        debeCambiarPassword: false,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cambiar password' })
  }
})

export default router
