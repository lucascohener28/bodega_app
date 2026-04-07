import * as express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: {
        id: 'desc',
      },
    })

    res.json(categorias)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de categoría inválido',
      })
    }

    const categoria = await prisma.categoria.findUnique({
      where: { id },
    })

    if (!categoria) {
      return res.status(404).json({
        error: 'Categoría no encontrada',
      })
    }

    res.json(categoria)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener la categoría' })
  }
})

router.post('/', async (req, res) => {
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
    res.status(500).json({ error: 'Error al crear categoría' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de categoría inválido',
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
        error: 'Categoría no encontrada',
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
      error: 'Error al actualizar categoría',
    })
  }
})

export default router