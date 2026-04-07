import * as express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const ingresos = await prisma.ingresoMercaderia.findMany({
      orderBy: {
        id: 'desc',
      },
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    res.json(ingresos)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener ingresos',
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de ingreso inválido',
      })
    }

    const ingreso = await prisma.ingresoMercaderia.findUnique({
      where: { id },
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    if (!ingreso) {
      return res.status(404).json({
        error: 'Ingreso no encontrado',
      })
    }

    res.json(ingreso)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener el ingreso',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const { proveedorId, tipoIngreso, observacion, detalles } = req.body

    if (!proveedorId || !tipoIngreso || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        error: 'Datos incompletos para registrar el ingreso',
      })
    }

    const proveedor = await prisma.proveedor.findUnique({
      where: {
        id: Number(proveedorId),
      },
    })

    if (!proveedor) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      })
    }

    const tiposValidos = ['CONSIGNACION', 'COMPRA_DIRECTA']

    if (!tiposValidos.includes(tipoIngreso)) {
      return res.status(400).json({
        error: 'Tipo de ingreso inválido',
      })
    }

    const productosIds = detalles.map((item: any) => Number(item.productoId))

    const productos = await prisma.producto.findMany({
      where: {
        id: {
          in: productosIds,
        },
      },
    })

    if (productos.length !== productosIds.length) {
      return res.status(400).json({
        error: 'Uno o más productos no existen',
      })
    }

    const ingreso = await prisma.$transaction(async (tx) => {
      const nuevoIngreso = await tx.ingresoMercaderia.create({
        data: {
          proveedorId: Number(proveedorId),
          tipoIngreso,
          observacion: observacion ? String(observacion).trim() : null,
        },
      })

      for (const item of detalles) {
        const productoId = Number(item.productoId)
        const cantidad = Number(item.cantidad)
        const costoUnitario = Number(item.costoUnitario)

        if (!productoId || cantidad <= 0 || costoUnitario < 0) {
          throw new Error('Detalle de ingreso inválido')
        }

        const subtotal = cantidad * costoUnitario

        await tx.detalleIngresoMercaderia.create({
          data: {
            ingresoId: nuevoIngreso.id,
            productoId,
            cantidad,
            costoUnitario,
            subtotal,
          },
        })

        await tx.producto.update({
          where: {
            id: productoId,
          },
          data: {
            stockActual: {
              increment: cantidad,
            },
          },
        })

        await tx.movimientoInventario.create({
          data: {
            productoId,
            tipoMovimiento: 'ENTRADA',
            cantidad,
            observacion: `Ingreso de mercadería #${nuevoIngreso.id}`,
          },
        })
      }

      return nuevoIngreso
    })

    const ingresoCompleto = await prisma.ingresoMercaderia.findUnique({
      where: {
        id: ingreso.id,
      },
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    res.status(201).json(ingresoCompleto)
  } catch (error: any) {
    console.error(error)

    if (error.message === 'Detalle de ingreso inválido') {
      return res.status(400).json({
        error: 'Uno de los detalles del ingreso es inválido',
      })
    }

    res.status(500).json({
      error: 'Error al registrar el ingreso',
    })
  }
})

export default router