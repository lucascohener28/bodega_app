import * as express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const ventas = await prisma.venta.findMany({
      orderBy: {
        id: 'desc',
      },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    res.json(ventas)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener ventas',
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de venta inválido',
      })
    }

    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    if (!venta) {
      return res.status(404).json({
        error: 'Venta no encontrada',
      })
    }

    res.json(venta)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener la venta',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const { metodoPago, observacion, detalles } = req.body
    if (!metodoPago || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        error: 'Datos incompletos para registrar la venta',
      })
    }

    const metodosValidos = ['EFECTIVO', 'TRANSFERENCIA', 'QR', 'MIXTO']

    if (!metodosValidos.includes(metodoPago)) {
      return res.status(400).json({
        error: 'Método de pago inválido',
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

    const venta = await prisma.$transaction(async (tx) => {
  let totalVenta = 0

  for (const item of detalles) {
    const cantidad = Number(item.cantidad)
    const precioUnitario = Number(item.precioUnitario)

    if (cantidad > 0 && precioUnitario >= 0) {
      totalVenta += cantidad * precioUnitario
    }
  }

  const nuevaVenta = await tx.venta.create({
  data: {
    metodoPago,
    observacion: observacion ? String(observacion).trim() : null,
    total: totalVenta,
  },
})

      for (const item of detalles) {
        const productoId = Number(item.productoId)
        const cantidad = Number(item.cantidad)
        const precioUnitario = Number(item.precioUnitario)

        if (!productoId || cantidad <= 0 || precioUnitario < 0) {
          throw new Error('Detalle de venta inválido')
        }

        const producto = await tx.producto.findUnique({
          where: { id: productoId },
        })

        if (!producto) {
          throw new Error('Producto no encontrado')
        }

        if (producto.stockActual < cantidad) {
          throw new Error(`Stock insuficiente para el producto ID ${productoId}`)
        }

        const subtotal = cantidad * precioUnitario

        await tx.detalleVenta.create({
          data: {
            ventaId: nuevaVenta.id,
            productoId,
            cantidad,
            precioUnitario,
            subtotal,
          },
        })

        await tx.producto.update({
          where: { id: productoId },
          data: {
            stockActual: {
              decrement: cantidad,
            },
          },
        })

        await tx.movimientoInventario.create({
          data: {
            productoId,
            tipoMovimiento: 'SALIDA',
            cantidad,
            observacion: `Venta #${nuevaVenta.id}`,
          },
        })
      }

      return nuevaVenta
    })

    const ventaCompleta = await prisma.venta.findUnique({
      where: {
        id: venta.id,
      },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    res.status(201).json(ventaCompleta)
  } catch (error: any) {
    console.error(error)

    if (
      error.message.includes('Stock insuficiente') ||
      error.message === 'Detalle de venta inválido'
    ) {
      return res.status(400).json({
        error: error.message,
      })
    }

    res.status(500).json({
      error: 'Error al registrar la venta',
    })
  }
})

export default router