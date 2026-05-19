import { Router } from 'express'
import { prisma } from '../config/prisma'
import { calcularSubtotalLiquidacion } from '../services/liquidaciones.service'

const router = Router()

function obtenerRangoPeriodo(periodo: string) {
  const [anio, mes] = String(periodo).split('-').map(Number)

  if (!anio || !mes) {
    return null
  }

  const fechaInicio = new Date(anio, mes - 1, 1)
  const fechaFin = new Date(anio, mes, 1)

  return { fechaInicio, fechaFin }
}

router.get('/', async (_req, res) => {
  try {
    const liquidaciones = await prisma.liquidacion.findMany({
      orderBy: {
        id: 'desc',
      },
      include: {
        proveedor: true,
        detallesVenta: {
          include: {
            producto: true,
          },
        },
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
        error: 'proveedorId invÃ¡lido',
      })
    }

    const rango = obtenerRangoPeriodo(String(periodo))

    if (!rango) {
      return res.status(400).json({
        error: 'El periodo debe tener formato YYYY-MM',
      })
    }

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
        mensaje:
          'No hay ventas pendientes de liquidar para ese proveedor en ese perÃ­odo',
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
        costoPack: number | null
        manejaPack: boolean
        unidadesPorPack: number | null
        totalVendido: number
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
          costoPack: item.producto.costoPack,
          manejaPack: item.producto.manejaPack,
          unidadesPorPack: item.producto.unidadesPorPack,
          totalVendido: 0,
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
          costoPack: item.producto.costoPack,
          manejaPack: item.producto.manejaPack,
          unidadesPorPack: item.producto.unidadesPorPack,
          totalVendido: 0,
          subtotalPagar: 0,
        }
      }

      resumenPorProducto[productoId].cantidadVendida += item.cantidad
      resumenPorProducto[productoId].totalVendido += item.subtotal
    }

    const detalles = Object.values(resumenPorProducto)
      .filter((item) => item.cantidadVendida > 0)
      .map((item) => {
        const subtotalPagar = calcularSubtotalLiquidacion(item.cantidadVendida, {
          costoProveedor: item.costoUnitario,
          costoPack: item.costoPack,
          manejaPack: item.manejaPack,
          unidadesPorPack: item.unidadesPorPack,
        })

        return {
          ...item,
          subtotalPagar,
        }
      })

    const totalGeneral = detalles.reduce(
      (acc, item) => acc + item.subtotalPagar,
      0
    )

    res.json({
      proveedor,
      periodo,
      detalles,
      totalGeneral,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al calcular la liquidaciÃ³n',
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de liquidaciÃ³n invÃ¡lido',
      })
    }

    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id },
      include: {
        proveedor: true,
        detallesVenta: {
          include: {
            producto: true,
          },
        },
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    if (!liquidacion) {
      return res.status(404).json({
        error: 'LiquidaciÃ³n no encontrada',
      })
    }

    res.json(liquidacion)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener la liquidaciÃ³n',
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
        error: 'proveedorId invÃ¡lido',
      })
    }

    const rango = obtenerRangoPeriodo(String(periodo))

    if (!rango) {
      return res.status(400).json({
        error: 'El periodo debe tener formato YYYY-MM',
      })
    }

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
      },
      include: {
        producto: true,
      },
    })

    if (ventasPendientes.length === 0) {
      return res.status(400).json({
        error:
          'No hay ventas pendientes de liquidar para ese proveedor en ese perÃ­odo',
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
        costoPack: number | null
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
          costoPack: item.producto.costoPack,
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
          costoPack: item.producto.costoPack,
          manejaPack: item.producto.manejaPack,
          unidadesPorPack: item.producto.unidadesPorPack,
          subtotal: 0,
        }
      }

      resumenPorProducto[productoId].cantidadVendida += item.cantidad
    }

    const detallesData = Object.values(resumenPorProducto)
      .filter((item) => item.cantidadVendida > 0)
      .map((item) => {
        const subtotal = calcularSubtotalLiquidacion(item.cantidadVendida, {
          costoProveedor: item.costoUnitario,
          costoPack: item.costoPack,
          manejaPack: item.manejaPack,
          unidadesPorPack: item.unidadesPorPack,
        })

        return {
          productoId: item.productoId,
          cantidadRecibida: item.cantidadRecibida,
          cantidadVendida: item.cantidadVendida,
          cantidadRestante: item.cantidadRestante,
          costoUnitario: item.costoUnitario,
          subtotal,
        }
      })

    const totalPagar = detallesData.reduce(
      (acc, item) => acc + item.subtotal,
      0
    )

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
      error: 'Error al guardar la liquidaciÃ³n',
    })
  }
})

router.patch('/:id/cerrar', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID de liquidaciÃ³n invÃ¡lido',
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
        error: 'LiquidaciÃ³n no encontrada',
      })
    }

    if (liquidacionExistente.cerrada) {
      return res.status(400).json({
        error: 'La liquidaciÃ³n ya estÃ¡ cerrada',
      })
    }

    const rango = obtenerRangoPeriodo(liquidacionExistente.periodo)

    if (!rango) {
      return res.status(400).json({
        error: 'El perÃ­odo de la liquidaciÃ³n es invÃ¡lido',
      })
    }

    const fechaLiquidacion = new Date()

    const liquidacionCerrada = await prisma.$transaction(async (tx) => {
      await tx.detalleVenta.updateMany({
        where: {
          liquidado: false,
          producto: {
            proveedorId: liquidacionExistente.proveedorId,
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
          fechaCierre: fechaLiquidacion,
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
      error: 'Error al cerrar la liquidaciÃ³n',
    })
  }
})

export default router
