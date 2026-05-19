import { Router } from 'express'
import { prisma } from '../config/prisma'
import {
  calcularDeudaPendienteTotal,
  calcularSubtotalLiquidacion,
} from '../services/liquidaciones.service'

const router = Router()

function margen(ganancia: number, venta: number) {
  if (venta <= 0) return 0
  return (ganancia / venta) * 100
}

router.get('/resumen', async (_req, res) => {
  try {
    const ahora = new Date()

    const inicioDia = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      0,
      0,
      0,
      0
    )

    const finDia = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      23,
      59,
      59,
      999
    )

    const inicioMes = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      1,
      0,
      0,
      0,
      0
    )

    const finMes = new Date(
      ahora.getFullYear(),
      ahora.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    )

    const [
      ventasHoy,
      ventasMes,
      productos,
      ultimasVentas,
      detallesVentaMes,
      ultimosMovimientos,
      ultimosIngresos,
      ultimasLiquidaciones,
      deudaProveedores,
    ] = await Promise.all([
      prisma.venta.findMany({
        where: {
          fecha: {
            gte: inicioDia,
            lte: finDia,
          },
        },
        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
        },
      }),
      prisma.venta.findMany({
        where: {
          fecha: {
            gte: inicioMes,
            lte: finMes,
          },
        },
        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
        },
      }),
      prisma.producto.findMany({
        include: {
          categoria: true,
          proveedor: true,
        },
      }),
      prisma.venta.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 5,
      }),
      prisma.detalleVenta.findMany({
        where: {
          venta: {
            fecha: {
              gte: inicioMes,
              lte: finMes,
            },
          },
        },
        include: {
          producto: true,
          venta: true,
        },
      }),
      prisma.movimientoInventario.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 5,
        include: {
          producto: true,
        },
      }),
      prisma.ingresoMercaderia.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 3,
        include: {
          proveedor: true,
        },
      }),
      prisma.liquidacion.findMany({
        where: {
          cerrada: true,
        },
        orderBy: {
          fechaCierre: 'desc',
        },
        take: 3,
        include: {
          proveedor: true,
        },
      }),
      calcularDeudaPendienteTotal(prisma),
    ])

    const totalVentasHoy = ventasHoy.reduce((acc, venta) => acc + venta.total, 0)
    const totalVentasMes = ventasMes.reduce((acc, venta) => acc + venta.total, 0)

    const calcularGananciaVentas = (ventas: typeof ventasHoy) => {
      const productosVendidos = new Map<
        number,
        {
          cantidadVendida: number
          totalVendido: number
          producto: (typeof ventasHoy)[number]['detalles'][number]['producto']
        }
      >()

      for (const venta of ventas) {
        for (const item of venta.detalles) {
          const actual =
            productosVendidos.get(item.productoId) ??
            {
              cantidadVendida: 0,
              totalVendido: 0,
              producto: item.producto,
            }

          actual.cantidadVendida += item.cantidad
          actual.totalVendido += item.subtotal
          productosVendidos.set(item.productoId, actual)
        }
      }

      return Array.from(productosVendidos.values()).reduce((acc, item) => {
        const costoRealProveedor = calcularSubtotalLiquidacion(
          item.cantidadVendida,
          item.producto
        )

        return acc + item.totalVendido - costoRealProveedor
      }, 0)
    }

    const gananciaHoy = calcularGananciaVentas(ventasHoy)
    const gananciaMes = calcularGananciaVentas(ventasMes)
    const cantidadVentasHoy = ventasHoy.length
    const cantidadVentasMes = ventasMes.length
    const ticketPromedioHoy =
      cantidadVentasHoy > 0 ? totalVentasHoy / cantidadVentasHoy : 0
    const ticketPromedioMes =
      cantidadVentasMes > 0 ? totalVentasMes / cantidadVentasMes : 0

    const productosBajoStock = productos.filter(
      (producto) => producto.stockActual <= producto.stockMinimo
    )

    const productosMes = new Map<
      number,
      {
        productoId: number
        nombre: string
        codigo: string
        cantidadVendida: number
        totalVendido: number
        gananciaTotal: number
        margen: number
        stockActual: number
        stockMinimo: number
        costoProveedor: number
        costoPack: number | null
        manejaPack: boolean
        unidadesPorPack: number | null
      }
    >()

    for (const item of detallesVentaMes) {
      if (!productosMes.has(item.productoId)) {
        productosMes.set(item.productoId, {
          productoId: item.productoId,
          nombre: item.producto.nombre,
          codigo: item.producto.codigo,
          cantidadVendida: 0,
          totalVendido: 0,
          gananciaTotal: 0,
          margen: 0,
          stockActual: item.producto.stockActual,
          stockMinimo: item.producto.stockMinimo,
          costoProveedor: item.producto.costoProveedor,
          costoPack: item.producto.costoPack,
          manejaPack: item.producto.manejaPack,
          unidadesPorPack: item.producto.unidadesPorPack,
        })
      }

      const actual = productosMes.get(item.productoId)!
      actual.cantidadVendida += item.cantidad
      actual.totalVendido += item.subtotal
    }

    const productosAnalizados = Array.from(productosMes.values()).map((item) => ({
      ...item,
      gananciaTotal:
        item.totalVendido -
        calcularSubtotalLiquidacion(item.cantidadVendida, {
          costoProveedor: item.costoProveedor,
          costoPack: item.costoPack,
          manejaPack: item.manejaPack,
          unidadesPorPack: item.unidadesPorPack,
        }),
    })).map((item) => ({
      ...item,
      margen: margen(item.gananciaTotal, item.totalVendido),
    }))

    const productosMasVendidos = [...productosAnalizados]
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 5)

    const productosMasRentables = [...productosAnalizados]
      .sort((a, b) => b.gananciaTotal - a.gananciaTotal)
      .slice(0, 5)

    const alertas: Array<{
      tipo: string
      mensaje: string
      prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
      producto?: string
    }> = []

    if (productosBajoStock.length > 0) {
      alertas.push({
        tipo: 'Stock critico',
        mensaje: `Stock critico en ${productosBajoStock.length} productos. Revisar reposicion.`,
        prioridad: 'ALTA',
      })
    }

    if (deudaProveedores > 0) {
      alertas.push({
        tipo: 'Deuda proveedores',
        mensaje: `Hay ${deudaProveedores.toLocaleString('es-PY')} Gs. pendientes. Revisar liquidaciones.`,
        prioridad: deudaProveedores > 500000 ? 'ALTA' : 'MEDIA',
      })
    }

    for (const producto of productosAnalizados) {
      const altaVenta = producto.cantidadVendida >= 3
      const bajoStock = producto.stockActual <= producto.stockMinimo
      const bajoMargen = producto.margen > 0 && producto.margen < 18
      const stockAlto =
        producto.stockMinimo > 0 && producto.stockActual >= producto.stockMinimo * 3
      const pocaVenta = producto.cantidadVendida <= 1

      if (altaVenta && bajoStock) {
        alertas.push({
          tipo: 'Reponer urgente',
          mensaje: `${producto.nombre} vende bien y esta bajo de stock.`,
          prioridad: 'ALTA',
          producto: producto.nombre,
        })
      }

      if (altaVenta && bajoMargen) {
        alertas.push({
          tipo: 'Revisar precio',
          mensaje: `${producto.nombre} rota bien, pero deja bajo margen.`,
          prioridad: 'MEDIA',
          producto: producto.nombre,
        })
      }

      if (stockAlto && pocaVenta) {
        alertas.push({
          tipo: 'Producto lento',
          mensaje: `${producto.nombre} tiene stock alto y poca venta este mes.`,
          prioridad: 'BAJA',
          producto: producto.nombre,
        })
      }
    }

    res.json({
      resumen: {
        totalVentasHoy,
        totalVentasMes,
        gananciaHoy,
        gananciaMes,
        cantidadVentasHoy,
        cantidadVentasMes,
        ticketPromedioHoy,
        ticketPromedioMes,
        deudaProveedores,
        cantidadProductos: productos.length,
        cantidadProductosBajoStock: productosBajoStock.length,
      },
      alertas: alertas.slice(0, 6),
      productosBajoStock,
      productosMasVendidos,
      productosMasRentables,
      productosMejorRotacion: productosMasVendidos,
      ultimasVentas,
      ultimosMovimientos,
      ultimosIngresos,
      ultimasLiquidaciones,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener el resumen del dashboard',
    })
  }
})

export default router
