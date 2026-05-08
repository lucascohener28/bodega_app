import { Router } from 'express'
import { prisma } from '../config/prisma'
import { roleMiddleware } from '../middlewares/role.middleware'
import { Rol } from '@prisma/client'

const router = Router()
const adminOnly = roleMiddleware([Rol.ADMIN])

router.get('/', async (_req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: {
        id: 'desc',
      },
      include: {
        _count: {
          select: {
            productos: true,
          },
        },
      },
    })

    res.json(
      categorias.map((categoria) => ({
        ...categoria,
        cantidadProductos: categoria._count.productos,
      }))
    )
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener categorÃ­as' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de categorÃ­a invÃ¡lido',
      })
    }

    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: {
        productos: {
          include: {
            proveedor: true,
          },
          orderBy: {
            nombre: 'asc',
          },
        },
        _count: {
          select: {
            productos: true,
          },
        },
      },
    })

    if (!categoria) {
      return res.status(404).json({
        error: 'CategorÃ­a no encontrada',
      })
    }

    res.json({
      ...categoria,
      cantidadProductos: categoria._count.productos,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener la categorÃ­a' })
  }
})

router.post('/', adminOnly, async (req, res) => {
  try {
    const { nombre } = req.body

    if (!nombre || typeof nombre !== 'string') {
      return res.status(400).json({
        error: 'El nombre es obligatorio',
      })
    }

    const categoria = await prisma.categoria.create({
      data: {
        nombre: nombre.trim(),
      },
    })

    res.status(201).json(categoria)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear categorÃ­a' })
  }
})

router.put('/:id', adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de categorÃ­a invÃ¡lido',
      })
    }

    const { nombre } = req.body

    if (nombre === undefined) {
      return res.status(400).json({
        error: 'Debes enviar el nombre',
      })
    }

    const categoriaExistente = await prisma.categoria.findUnique({
      where: { id },
    })

    if (!categoriaExistente) {
      return res.status(404).json({
        error: 'CategorÃ­a no encontrada',
      })
    }

    const categoriaActualizada = await prisma.categoria.update({
      where: { id },
      data: {
        nombre: String(nombre).trim(),
      },
    })

    res.json(categoriaActualizada)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al actualizar categorÃ­a',
    })
  }
})

export default router
