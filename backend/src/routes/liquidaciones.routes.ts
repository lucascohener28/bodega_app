import * as express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const liquidaciones = await prisma.liquidacion.findMany({
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

    res.json(liquidaciones)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener liquidaciones',
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de liquidación inválido',
      })
    }

    const liquidacion = await prisma.liquidacion.findUnique({
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

    if (!liquidacion) {
      return res.status(404).json({
        error: 'Liquidación no encontrada',
      })
    }

    res.json(liquidacion)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener la liquidación',
    })
  }
})

router.get('/resumen/calculo', async (req, res) => {
  try {
    const { proveedorId, periodo } = req.query

    if (!proveedorId || !periodo) {
      return res.status(400).json({
        error: 'Debes enviar proveedorId y periodo',
      })
    }

    const proveedorIdNumber = Number(proveedorId)

    if (isNaN(proveedorIdNumber)) {
      return res.status(400).json({
        error: 'proveedorId inválido',
      })
    }

    const [anio, mes] = String(periodo).split('-').map(Number)

    if (!anio || !mes) {
      return res.status(400).json({
        error: 'El periodo debe tener formato YYYY-MM',
      })
    }

    const fechaInicio = new Date(anio, mes - 1, 1)
    const fechaFin = new Date(anio, mes, 1)

    const proveedor = await prisma.proveedor.findUnique({
      where: {
        id: proveedorIdNumber,
      },
    })

    if (!proveedor) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      })
    }

    const ingresos = await prisma.detalleIngresoMercaderia.findMany({
      where: {
        ingreso: {
          proveedorId: proveedorIdNumber,
          fecha: {
            gte: fechaInicio,
            lt: fechaFin,
          },
        },
      },
      include: {
        producto: true,
      },
    })

    if (ingresos.length === 0) {
      return res.json({
        proveedor,
        periodo,
        detalles: [],
        totalGeneral: 0,
        mensaje: 'No hay ingresos para ese proveedor en ese período',
      })
    }

    const ventas = await prisma.detalleVenta.findMany({
      where: {
        producto: {
          proveedorId: proveedorIdNumber,
        },
        venta: {
          fecha: {
            gte: fechaInicio,
            lt: fechaFin,
          },
        },
      },
      include: {
        producto: true,
      },
    })

    const resumenPorProducto = new Map<
      number,
      {
        productoId: number
        nombreProducto: string
        cantidadIngresada: number
        cantidadVendida: number
        stockActual: number
        costoUnitario: number
        subtotalPagar: number
      }
    >()

    for (const item of ingresos) {
      const productoId = item.productoId

      if (!resumenPorProducto.has(productoId)) {
        resumenPorProducto.set(productoId, {
          productoId,
          nombreProducto: item.producto.nombre,
          cantidadIngresada: 0,
          cantidadVendida: 0,
          stockActual: item.producto.stockActual,
          costoUnitario: item.costoUnitario,
          subtotalPagar: 0,
        })
      }

      const actual = resumenPorProducto.get(productoId)!
      actual.cantidadIngresada += item.cantidad
    }

    for (const item of ventas) {
      const productoId = item.productoId

      if (!resumenPorProducto.has(productoId)) {
        resumenPorProducto.set(productoId, {
          productoId,
          nombreProducto: item.producto.nombre,
          cantidadIngresada: 0,
          cantidadVendida: 0,
          stockActual: item.producto.stockActual,
          costoUnitario: item.producto.costoProveedor,
          subtotalPagar: 0,
        })
      }

      const actual = resumenPorProducto.get(productoId)!
      actual.cantidadVendida += item.cantidad
    }

    let totalGeneral = 0

    const detalles = Array.from(resumenPorProducto.values()).map((item) => {
      const subtotalPagar = item.cantidadVendida * item.costoUnitario
      totalGeneral += subtotalPagar

      return {
        ...item,
        subtotalPagar,
      }
    })

    res.json({
      proveedor,
      periodo,
      detalles,
      totalGeneral,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al calcular la liquidación',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const { proveedorId, periodo, observacion } = req.body

    if (!proveedorId || !periodo) {
      return res.status(400).json({
        error: 'Debes enviar proveedorId y periodo',
      })
    }

    const proveedorIdNumber = Number(proveedorId)

    if (isNaN(proveedorIdNumber)) {
      return res.status(400).json({
        error: 'proveedorId inválido',
      })
    }

    const [anio, mes] = String(periodo).split('-').map(Number)

    if (!anio || !mes) {
      return res.status(400).json({
        error: 'El periodo debe tener formato YYYY-MM',
      })
    }

    const fechaInicio = new Date(anio, mes - 1, 1)
    const fechaFin = new Date(anio, mes, 1)

    const proveedor = await prisma.proveedor.findUnique({
      where: {
        id: proveedorIdNumber,
      },
    })

    if (!proveedor) {
      return res.status(404).json({
        error: 'Proveedor no encontrado',
      })
    }

    const ingresos = await prisma.detalleIngresoMercaderia.findMany({
      where: {
        ingreso: {
          proveedorId: proveedorIdNumber,
          fecha: {
            gte: fechaInicio,
            lt: fechaFin,
          },
        },
      },
      include: {
        producto: true,
      },
    })

    if (ingresos.length === 0) {
      return res.status(400).json({
        error: 'No hay ingresos para ese proveedor en ese período',
      })
    }

    const ventas = await prisma.detalleVenta.findMany({
      where: {
        producto: {
          proveedorId: proveedorIdNumber,
        },
        venta: {
          fecha: {
            gte: fechaInicio,
            lt: fechaFin,
          },
        },
      },
      include: {
        producto: true,
      },
    })

    const resumenPorProducto = new Map<
      number,
      {
        productoId: number
        cantidadRecibida: number
        cantidadVendida: number
        cantidadRestante: number
        costoUnitario: number
        subtotal: number
      }
    >()

    for (const item of ingresos) {
      const productoId = item.productoId

      if (!resumenPorProducto.has(productoId)) {
        resumenPorProducto.set(productoId, {
          productoId,
          cantidadRecibida: 0,
          cantidadVendida: 0,
          cantidadRestante: item.producto.stockActual,
          costoUnitario: item.costoUnitario,
          subtotal: 0,
        })
      }

      const actual = resumenPorProducto.get(productoId)!
      actual.cantidadRecibida += item.cantidad
    }

    for (const item of ventas) {
      const productoId = item.productoId

      if (!resumenPorProducto.has(productoId)) {
        resumenPorProducto.set(productoId, {
          productoId,
          cantidadRecibida: 0,
          cantidadVendida: 0,
          cantidadRestante: item.producto.stockActual,
          costoUnitario: item.producto.costoProveedor,
          subtotal: 0,
        })
      }

      const actual = resumenPorProducto.get(productoId)!
      actual.cantidadVendida += item.cantidad
    }

    let totalPagar = 0
    const detallesData = Array.from(resumenPorProducto.values()).map((item) => {
      const subtotal = item.cantidadVendida * item.costoUnitario
      totalPagar += subtotal

      return {
        productoId: item.productoId,
        cantidadRecibida: item.cantidadRecibida,
        cantidadVendida: item.cantidadVendida,
        cantidadRestante: item.cantidadRestante,
        costoUnitario: item.costoUnitario,
        subtotal,
      }
    })

    const liquidacion = await prisma.$transaction(async (tx) => {
      const nuevaLiquidacion = await tx.liquidacion.create({
        data: {
          proveedorId: proveedorIdNumber,
          periodo: String(periodo),
          totalPagar,
          cerrada: false,
          observacion: observacion ? String(observacion).trim() : null,
        },
      })

      for (const item of detallesData) {
        await tx.detalleLiquidacion.create({
          data: {
            liquidacionId: nuevaLiquidacion.id,
            productoId: item.productoId,
            cantidadRecibida: item.cantidadRecibida,
            cantidadVendida: item.cantidadVendida,
            cantidadRestante: item.cantidadRestante,
            costoUnitario: item.costoUnitario,
            subtotal: item.subtotal,
          },
        })
      }

      return nuevaLiquidacion
    })

    const liquidacionCompleta = await prisma.liquidacion.findUnique({
      where: {
        id: liquidacion.id,
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

    res.status(201).json(liquidacionCompleta)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al guardar la liquidación',
    })
  }
})

router.patch('/:id/cerrar', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de liquidación inválido',
      })
    }

    const liquidacionExistente = await prisma.liquidacion.findUnique({
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

    if (!liquidacionExistente) {
      return res.status(404).json({
        error: 'Liquidación no encontrada',
      })
    }

    if (liquidacionExistente.cerrada) {
      return res.status(400).json({
        error: 'La liquidación ya está cerrada',
      })
    }

    const liquidacionCerrada = await prisma.liquidacion.update({
      where: { id },
      data: {
        cerrada: true,
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

    res.json(liquidacionCerrada)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al cerrar la liquidación',
    })
  }
})

export default router