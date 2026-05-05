import express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

function calcularCostoLiquidacion(
  cantidad: number,
  costoProveedor: number,
  manejaPack: boolean,
  unidadesPorPack: number | null
) {
  if (manejaPack && unidadesPorPack && unidadesPorPack > 0) {
    return Math.ceil(cantidad / unidadesPorPack) * unidadesPorPack * costoProveedor
  }

  return cantidad * costoProveedor
}

async function calcularDeudaPendiente(proveedorId: number) {
  const ventasPendientes = await prisma.detalleVenta.findMany({
    where: {
      liquidado: false,
      producto: {
        proveedorId,
      },
    },
    include: {
      producto: true,
    },
  })

  return ventasPendientes.reduce(
    (acc, item) =>
      acc +
      calcularCostoLiquidacion(
        item.cantidad,
        item.producto.costoProveedor,
        item.producto.manejaPack,
        item.producto.unidadesPorPack
      ),
    0
  )
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
        deudaPendiente: await calcularDeudaPendiente(proveedor.id),
      }))
    )

    res.json(resultado)
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
      deudaPendiente: await calcularDeudaPendiente(proveedor.id),
    })
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
