import { Router } from 'express'
import { prisma } from '../config/prisma'
import { calcularDeudaPendienteProveedor } from '../services/liquidaciones.service'

const router = Router()

async function setProveedorPredeterminado(id: number) {
  return prisma.$transaction(async (tx) => {
    await tx.proveedor.updateMany({
      where: {
        id: {
          not: id,
        },
        predeterminado: true,
      },
      data: {
        predeterminado: false,
      },
    })

    return tx.proveedor.update({
      where: { id },
      data: {
        activo: true,
        predeterminado: true,
      },
    })
  })
}

router.get('/', async (_req, res) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: {
        id: 'desc',
      },
      include: {
        _count: {
          select: {
            productos: true,
            liquidaciones: true,
          },
        },
      },
    })

    const resultado = await Promise.all(
      proveedores.map(async (proveedor) => ({
        ...proveedor,
        cantidadProductos: proveedor._count.productos,
        cantidadLiquidaciones: proveedor._count.liquidaciones,
        deudaPendiente: await calcularDeudaPendienteProveedor(prisma, proveedor.id),
      }))
    )

    res.json(resultado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener proveedores' })
  }
})

router.get('/predeterminado/activo', async (_req, res) => {
  try {
    const proveedor = await prisma.proveedor.findFirst({
      where: {
        activo: true,
        predeterminado: true,
      },
      orderBy: {
        id: 'asc',
      },
    })

    if (!proveedor) {
      return res.status(404).json({
        error: 'No hay proveedor predeterminado activo configurado',
      })
    }

    res.json(proveedor)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener proveedor predeterminado' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de proveedor invÃ¡lido',
      })
    }

    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
      include: {
        productos: {
          include: {
            categoria: true,
          },
          orderBy: {
            nombre: 'asc',
          },
        },
        liquidaciones: {
          orderBy: {
            id: 'desc',
          },
        },
        _count: {
          select: {
            productos: true,
            liquidaciones: true,
          },
        },
      },
    })

    if (!proveedor) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      })
    }

    res.json({
      ...proveedor,
      cantidadProductos: proveedor._count.productos,
      cantidadLiquidaciones: proveedor._count.liquidaciones,
      deudaPendiente: await calcularDeudaPendienteProveedor(prisma, proveedor.id),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el proveedor' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, activo, predeterminado } = req.body

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
        predeterminado: false,
      },
    })

    if (predeterminado === true) {
      return res.status(201).json(await setProveedorPredeterminado(proveedor.id))
    }

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
        error: 'ID de proveedor invÃ¡lido',
      })
    }

    const { nombre, telefono, activo, predeterminado } = req.body

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
        predeterminado: predeterminado === false ? false : undefined,
      },
    })

    if (predeterminado === true) {
      return res.json(await setProveedorPredeterminado(id))
    }

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
        error: 'ID de proveedor invÃ¡lido',
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
