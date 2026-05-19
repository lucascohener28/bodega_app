import { Router } from 'express'
import { prisma } from '../config/prisma'
import { calcularSubtotalLiquidacion } from '../services/liquidaciones.service'

const router = Router()

function getDateRange(start?: string, end?: string) {
  const where: {
    gte?: Date
    lte?: Date
  } = {}

  if (start) {
    where.gte = new Date(`${start}T00:00:00`)
  }

  if (end) {
    where.lte = new Date(`${end}T23:59:59`)
  }

  return Object.keys(where).length > 0 ? where : undefined
}

function marginPercent(gananciaTotal: number, totalVendido: number) {
  if (totalVendido <= 0) return 0
  return (gananciaTotal / totalVendido) * 100
}

router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query
    const dateRange = getDateRange(
      start ? String(start) : undefined,
      end ? String(end) : undefined
    )

    const [ventas, productos] = await Promise.all([
      prisma.venta.findMany({
        where: {
          fecha: dateRange,
        },
        include: {
          detalles: {
            include: {
              producto: {
                include: {
                  categoria: true,
                  proveedor: true,
                },
              },
            },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
      }),
      prisma.producto.findMany({
        include: {
          categoria: true,
          proveedor: true,
        },
      }),
    ])

    const productosMap = new Map<
      number,
      {
        productoId: number
        nombre: string
        codigo: string
        categoria: string
        proveedor: string
        stockActual: number
        stockMinimo: number
        costoProveedor: number
        costoPack: number | null
        manejaPack: boolean
        unidadesPorPack: number | null
        cantidadVendida: number
        totalVendido: number
        costoTotal: number
        precioPromedioVenta: number
        gananciaUnidad: number
        gananciaTotal: number
        margen: number
      }
    >()

    for (const producto of productos) {
      productosMap.set(producto.id, {
        productoId: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        categoria: producto.categoria.nombre,
        proveedor: producto.proveedor.nombre,
        stockActual: producto.stockActual,
        stockMinimo: producto.stockMinimo,
        costoProveedor: producto.costoProveedor,
        costoPack: producto.costoPack,
        manejaPack: producto.manejaPack,
        unidadesPorPack: producto.unidadesPorPack,
        cantidadVendida: 0,
        totalVendido: 0,
        costoTotal: 0,
        precioPromedioVenta: 0,
        gananciaUnidad: 0,
        gananciaTotal: 0,
        margen: 0,
      })
    }

    for (const venta of ventas) {
      for (const detalle of venta.detalles) {
        const row = productosMap.get(detalle.productoId)

        if (!row) continue

        row.cantidadVendida += detalle.cantidad
        row.totalVendido += detalle.subtotal
      }
    }

    const productosAnalizados = Array.from(productosMap.values()).map((item) => {
      const precioPromedioVenta =
        item.cantidadVendida > 0 ? item.totalVendido / item.cantidadVendida : 0
      const costoTotal = calcularSubtotalLiquidacion(item.cantidadVendida, {
        costoProveedor: item.costoProveedor,
        costoPack: item.costoPack,
        manejaPack: item.manejaPack,
        unidadesPorPack: item.unidadesPorPack,
      })
      const gananciaTotal = item.totalVendido - costoTotal
      const gananciaUnidad =
        item.cantidadVendida > 0 ? gananciaTotal / item.cantidadVendida : 0

      return {
        ...item,
        precioPromedioVenta,
        costoTotal,
        gananciaUnidad,
        gananciaTotal,
        margen: marginPercent(gananciaTotal, item.totalVendido),
      }
    })

    const productosConVentas = productosAnalizados.filter(
      (item) => item.cantidadVendida > 0
    )

    const totalVendido = ventas.reduce((acc, venta) => acc + venta.total, 0)
    const gananciaTotal = productosAnalizados.reduce(
      (acc, item) => acc + item.gananciaTotal,
      0
    )
    const cantidadVentas = ventas.length
    const ticketPromedio = cantidadVentas > 0 ? totalVendido / cantidadVentas : 0
    const productoMasVendido =
      [...productosConVentas].sort((a, b) => b.cantidadVendida - a.cantidadVendida)[0] ??
      null
    const productoMasRentable =
      [...productosConVentas].sort((a, b) => b.gananciaTotal - a.gananciaTotal)[0] ??
      null

    const cantidadPromedio =
      productosConVentas.length > 0
        ? productosConVentas.reduce((acc, item) => acc + item.cantidadVendida, 0) /
          productosConVentas.length
        : 0
    const gananciaPromedio =
      productosConVentas.length > 0
        ? productosConVentas.reduce((acc, item) => acc + item.gananciaTotal, 0) /
          productosConVentas.length
        : 0

    const masVendidos = [...productosConVentas].sort(
      (a, b) => b.cantidadVendida - a.cantidadVendida
    )

    const masRentables = [...productosConVentas].sort(
      (a, b) => b.gananciaTotal - a.gananciaTotal
    )

    const bajoRendimiento = [...productosAnalizados]
      .filter(
        (item) =>
          item.cantidadVendida <= Math.max(1, cantidadPromedio * 0.4) ||
          item.gananciaTotal <= Math.max(0, gananciaPromedio * 0.35) ||
          (item.cantidadVendida > 0 && item.margen < 15)
      )
      .sort((a, b) => a.gananciaTotal - b.gananciaTotal)

    const alertas: Array<{
      productoId: number
      producto: string
      codigo: string
      tipo: string
      mensaje: string
      prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
      cantidadVendida: number
      stockActual: number
      margen: number
      gananciaTotal: number
    }> = []

    for (const item of productosAnalizados) {
      const ventasAltas = item.cantidadVendida >= Math.max(3, cantidadPromedio * 1.2)
      const ventasBajas = item.cantidadVendida <= Math.max(1, cantidadPromedio * 0.5)
      const stockBajo = item.stockActual <= item.stockMinimo
      const stockAlto = item.stockMinimo > 0 && item.stockActual >= item.stockMinimo * 3
      const margenBajo = item.cantidadVendida > 0 && item.margen < 18
      const margenAlto = item.margen >= 35

      if (stockBajo && ventasAltas) {
        alertas.push({
          productoId: item.productoId,
          producto: item.nombre,
          codigo: item.codigo,
          tipo: 'REPOSICION URGENTE',
          mensaje: 'Se vende fuerte y el stock esta bajo. Priorizar reposicion.',
          prioridad: 'ALTA',
          cantidadVendida: item.cantidadVendida,
          stockActual: item.stockActual,
          margen: item.margen,
          gananciaTotal: item.gananciaTotal,
        })
      }

      if (stockAlto && ventasBajas) {
        alertas.push({
          productoId: item.productoId,
          producto: item.nombre,
          codigo: item.codigo,
          tipo: 'PRODUCTO LENTO',
          mensaje: 'Tiene mucho stock y poca salida. Evitar comprar mas por ahora.',
          prioridad: 'MEDIA',
          cantidadVendida: item.cantidadVendida,
          stockActual: item.stockActual,
          margen: item.margen,
          gananciaTotal: item.gananciaTotal,
        })
      }

      if (ventasAltas && margenBajo) {
        alertas.push({
          productoId: item.productoId,
          producto: item.nombre,
          codigo: item.codigo,
          tipo: 'ALTA ROTACION BAJO MARGEN',
          mensaje: 'Vende mucho, pero deja poco margen. Revisar precio o costo.',
          prioridad: 'MEDIA',
          cantidadVendida: item.cantidadVendida,
          stockActual: item.stockActual,
          margen: item.margen,
          gananciaTotal: item.gananciaTotal,
        })
      }

      if (ventasBajas && margenAlto && item.cantidadVendida > 0) {
        alertas.push({
          productoId: item.productoId,
          producto: item.nombre,
          codigo: item.codigo,
          tipo: 'OPORTUNIDAD',
          mensaje: 'Vende poco, pero deja buen margen. Conviene impulsarlo.',
          prioridad: 'BAJA',
          cantidadVendida: item.cantidadVendida,
          stockActual: item.stockActual,
          margen: item.margen,
          gananciaTotal: item.gananciaTotal,
        })
      }
    }

    res.json({
      resumen: {
        totalVendido,
        gananciaTotal,
        cantidadVentas,
        ticketPromedio,
        productoMasVendido: productoMasVendido
          ? {
              nombre: productoMasVendido.nombre,
              cantidadVendida: productoMasVendido.cantidadVendida,
            }
          : null,
        productoMasRentable: productoMasRentable
          ? {
              nombre: productoMasRentable.nombre,
              gananciaTotal: productoMasRentable.gananciaTotal,
            }
          : null,
      },
      productos: {
        masVendidos,
        masRentables,
        bajoRendimiento,
        alertas,
      },
      ganancias: productosConVentas.sort((a, b) => b.gananciaTotal - a.gananciaTotal),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener reportes',
    })
  }
})

export default router
