import * as express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: {
        id: 'desc',
      },
    })

    res.json(proveedores)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener proveedores' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de proveedor inválido',
      })
    }

    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
    })

    if (!proveedor) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      })
    }

    res.json(proveedor)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el proveedor' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, activo } = req.body

    if (!nombre || typeof nombre !== 'string') {
      return res.status(400).json({
        error: 'El nombre es obligatorio',
      })
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono ? String(telefono).trim() : null,
        activo: activo !== undefined ? Boolean(activo) : true,
      },
    })

    res.status(201).json(proveedor)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear proveedor' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de proveedor inválido',
      })
    }

    const { nombre, telefono, activo } = req.body

    const proveedorExistente = await prisma.proveedor.findUnique({
      where: { id },
    })

    if (!proveedorExistente) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      })
    }

    const proveedorActualizado = await prisma.proveedor.update({
      where: { id },
      data: {
        nombre: nombre !== undefined ? String(nombre).trim() : undefined,
        telefono: telefono !== undefined ? String(telefono).trim() : undefined,
        activo: activo !== undefined ? Boolean(activo) : undefined,
      },
    })

    res.json(proveedorActualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al actualizar proveedor',
    })
  }
})

router.patch('/:id/estado', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de proveedor inválido',
      })
    }

    const { activo } = req.body

    if (activo === undefined) {
      return res.status(400).json({
        error: 'Debes enviar el campo activo',
      })
    }

    const proveedorExistente = await prisma.proveedor.findUnique({
      where: { id },
    })

    if (!proveedorExistente) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      })
    }

    const proveedorActualizado = await prisma.proveedor.update({
      where: { id },
      data: {
        activo: Boolean(activo),
      },
    })

    res.json(proveedorActualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al cambiar el estado del proveedor',
    })
  }
})

export default router