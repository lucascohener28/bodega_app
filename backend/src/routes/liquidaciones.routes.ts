import * as express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

function obtenerRangoPeriodo(periodo: string) {
  const [anio, mes] = String(periodo).split('-').map(Number)

  if (!anio || !mes) {
    return null
  }

  const fechaInicio = new Date(anio, mes - 1, 1)
  const fechaFin = new Date(anio, mes, 1)

  return { fechaInicio, fechaFin }
}

function calcularSubtotalPagar(
  cantidadVendida: number,
  costoUnitario: number,
  manejaPack: boolean,
  unidadesPorPack: number | null
) {
  if (manejaPack && unidadesPorPack && unidadesPorPack > 0) {
    const packs = Math.ceil(cantidadVendida / unidadesPorPack)
    return packs * unidadesPorPack * costoUnitario
  }

  return cantidadVendida * costoUnitario
}

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

    const rango = obtenerRangoPeriodo(String(periodo))

    if (!rango) {
      return res.status(400).json({
        error: 'El periodo debe tener formato YYYY-MM',
      })
    }

    const { fechaInicio, fechaFin } = rango

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

    const ventasPendientes = await prisma.detalleVenta.findMany({
      where: {
        liquidado: false,
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

    if (ventasPendientes.length === 0) {
      return res.json({
        proveedor,
        periodo,
        detalles: [],
        totalGeneral: 0,
        mensaje: 'No hay ventas pendientes de liquidar para ese proveedor en ese período',
      })
    }

    const resumenPorProducto: Record<
      number,
      {
        productoId: number
        nombreProducto: string
        cantidadIngresada: number
        cantidadVendida: number
        stockActual: number
        costoUnitario: number
        manejaPack: boolean
        unidadesPorPack: number | null
        subtotalPagar: number
      }
    > = {}

    for (const item of ingresos) {
      const productoId = item.productoId

      if (!resumenPorProducto[productoId]) {
        resumenPorProducto[productoId] = {
          productoId,
          nombreProducto: item.producto.nombre,
          cantidadIngresada: 0,
          cantidadVendida: 0,
          stockActual: item.producto.stockActual,
          costoUnitario: item.producto.costoProveedor,
          manejaPack: item.producto.manejaPack,
          unidadesPorPack: item.producto.unidadesPorPack,
          subtotalPagar: 0,
        }
      }

      resumenPorProducto[productoId].cantidadIngresada += item.cantidad
    }

    for (const item of ventasPendientes) {
      const productoId = item.productoId

      if (!resumenPorProducto[productoId]) {
        resumenPorProducto[productoId] = {
          productoId,
          nombreProducto: item.producto.nombre,
          cantidadIngresada: 0,
          cantidadVendida: 0,
          stockActual: item.producto.stockActual,
          costoUnitario: item.producto.costoProveedor,
          manejaPack: item.producto.manejaPack,
          unidadesPorPack: item.producto.unidadesPorPack,
          subtotalPagar: 0,
        }
      }

      resumenPorProducto[productoId].cantidadVendida += item.cantidad
    }

    let totalGeneral = 0

    const detalles = Object.values(resumenPorProducto).map((item) => {
      const subtotalPagar = calcularSubtotalPagar(
        item.cantidadVendida,
        item.costoUnitario,
        item.manejaPack,
        item.unidadesPorPack
      )

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

    const rango = obtenerRangoPeriodo(String(periodo))

    if (!rango) {
      return res.status(400).json({
        error: 'El periodo debe tener formato YYYY-MM',
      })
    }

    const { fechaInicio, fechaFin } = rango

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

    const ventasPendientes = await prisma.detalleVenta.findMany({
      where: {
        liquidado: false,
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

    if (ventasPendientes.length === 0) {
      return res.status(400).json({
        error: 'No hay ventas pendientes de liquidar para ese proveedor en ese período',
      })
    }

    const resumenPorProducto: Record<
      number,
      {
        productoId: number
        cantidadRecibida: number
        cantidadVendida: number
        cantidadRestante: number
        costoUnitario: number
        manejaPack: boolean
        unidadesPorPack: number | null
        subtotal: number
      }
    > = {}

    for (const item of ingresos) {
      const productoId = item.productoId

      if (!resumenPorProducto[productoId]) {
        resumenPorProducto[productoId] = {
          productoId,
          cantidadRecibida: 0,
          cantidadVendida: 0,
          cantidadRestante: item.producto.stockActual,
          costoUnitario: item.producto.costoProveedor,
          manejaPack: item.producto.manejaPack,
          unidadesPorPack: item.producto.unidadesPorPack,
          subtotal: 0,
        }
      }

      resumenPorProducto[productoId].cantidadRecibida += item.cantidad
    }

    for (const item of ventasPendientes) {
      const productoId = item.productoId

      if (!resumenPorProducto[productoId]) {
        resumenPorProducto[productoId] = {
          productoId,
          cantidadRecibida: 0,
          cantidadVendida: 0,
          cantidadRestante: item.producto.stockActual,
          costoUnitario: item.producto.costoProveedor,
          manejaPack: item.producto.manejaPack,
          unidadesPorPack: item.producto.unidadesPorPack,
          subtotal: 0,
        }
      }

      resumenPorProducto[productoId].cantidadVendida += item.cantidad
    }

    let totalPagar = 0

    const detallesData = Object.values(resumenPorProducto).map((item) => {
      const subtotal = calcularSubtotalPagar(
        item.cantidadVendida,
        item.costoUnitario,
        item.manejaPack,
        item.unidadesPorPack
      )

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

    const rango = obtenerRangoPeriodo(liquidacionExistente.periodo)

    if (!rango) {
      return res.status(400).json({
        error: 'El período de la liquidación es inválido',
      })
    }

    const { fechaInicio, fechaFin } = rango
    const fechaLiquidacion = new Date()

    const liquidacionCerrada = await prisma.$transaction(async (tx) => {
      await tx.detalleVenta.updateMany({
        where: {
          liquidado: false,
          producto: {
            proveedorId: liquidacionExistente.proveedorId,
          },
          venta: {
            fecha: {
              gte: fechaInicio,
              lt: fechaFin,
            },
          },
        },
        data: {
          liquidado: true,
          liquidadoAt: fechaLiquidacion,
          liquidacionId: liquidacionExistente.id,
        },
      })

      return tx.liquidacion.update({
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