import { Router } from 'express'
import { Rol } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'
import { hashPassword } from '../../utils/password'

const router = Router()
const adminOnly = [Rol.ADMIN]

router.use(authMiddleware, roleMiddleware(adminOnly))

function parseRol(value: unknown) {
  if (value === Rol.ADMIN || value === Rol.CAJERO) {
    return value
  }

  return null
}

function sanitizeEmail(email: unknown) {
  const value = String(email || '').trim()
  return value ? value : null
}

router.get('/', async (_req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nombre: true,
        username: true,
        email: true,
        rol: true,
        activo: true,
        debeCambiarPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json(usuarios)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

router.post('/', async (req, res) => {
  try {
    const nombre = String(req.body.nombre || '').trim()
    const username = String(req.body.username || '').trim()
    const password = String(req.body.password || '')
    const email = sanitizeEmail(req.body.email)
    const rol = parseRol(req.body.rol) || Rol.CAJERO

    if (!nombre || !username || !password) {
      return res.status(400).json({ error: 'Nombre, username y password son obligatorios' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La password debe tener al menos 6 caracteres' })
    }

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        username,
        email,
        password: await hashPassword(password),
        rol,
        debeCambiarPassword: true,
      },
      select: {
        id: true,
        nombre: true,
        username: true,
        email: true,
        rol: true,
        activo: true,
        debeCambiarPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.status(201).json(usuario)
  } catch (error: any) {
    console.error(error)

    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Username o email ya existe' })
    }

    res.status(500).json({ error: 'Error al crear usuario' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const id = req.params.id
    const nombre = String(req.body.nombre || '').trim()
    const email = sanitizeEmail(req.body.email)
    const rol = parseRol(req.body.rol)
    const activo =
      typeof req.body.activo === 'boolean' ? req.body.activo : undefined

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es obligatorio' })
    }

    if (!rol) {
      return res.status(400).json({ error: 'Rol invalido' })
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        nombre,
        email,
        rol,
        ...(activo !== undefined ? { activo } : {}),
      },
      select: {
        id: true,
        nombre: true,
        username: true,
        email: true,
        rol: true,
        activo: true,
        debeCambiarPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json(usuario)
  } catch (error: any) {
    console.error(error)

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email ya existe' })
    }

    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

router.patch('/:id/desactivar', async (req, res) => {
  try {
    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data: { activo: false },
      select: {
        id: true,
        nombre: true,
        username: true,
        email: true,
        rol: true,
        activo: true,
        debeCambiarPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json(usuario)
  } catch (error: any) {
    console.error(error)

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.status(500).json({ error: 'Error al desactivar usuario' })
  }
})

router.patch('/:id/reset-password', async (req, res) => {
  try {
    const password = String(req.body.password || '')

    if (password.length < 6) {
      return res.status(400).json({ error: 'La nueva password debe tener al menos 6 caracteres' })
    }

    await prisma.usuario.update({
      where: { id: req.params.id },
      data: {
        password: await hashPassword(password),
        debeCambiarPassword: true,
      },
    })

    res.json({ message: 'Password actualizada correctamente' })
  } catch (error: any) {
    console.error(error)

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.status(500).json({ error: 'Error al resetear password' })
  }
})

export default router
