import * as express from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'

const router = express.Router()

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

    const [ventasHoy, ventasMes, productos, ultimasVentas, detallesVenta] =
      await Promise.all([
        prisma.venta.findMany({
          where: {
            fecha: {
              gte: inicioDia,
              lte: finDia,
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
          include: {
            detalles: {
              include: {
                producto: true,
              },
            },
          },
        }),

        prisma.detalleVenta.findMany({
          include: {
            producto: true,
          },
        }),
      ])

    type DetalleVentaPendiente = Prisma.DetalleVentaGetPayload<{
      include: {
        producto: {
          select: {
            costoProveedor: true
            manejaPack: true
            unidadesPorPack: true
          }
        }
      }
    }>

    const detallesVentaPendientes: DetalleVentaPendiente[] =
      await prisma.detalleVenta.findMany({
        where: {
          liquidacionId: null,
        },
        include: {
          producto: {
            select: {
              costoProveedor: true,
              manejaPack: true,
              unidadesPorPack: true,
            },
          },
        },
      })

      

    const totalVentasHoy = ventasHoy.reduce(
      (acc: number, venta: { total: number }) => acc + venta.total,
      0
    )

    const totalVentasMes = ventasMes.reduce(
      (acc: number, venta: { total: number }) => acc + venta.total,
      0
    )

    const productosBajoStock = productos.filter(
      (producto: { stockActual: number; stockMinimo: number }) =>
        producto.stockActual <= producto.stockMinimo
    )

    const deudaAgrupadaPorProducto: Record<
  number,
  {
    cantidadVendida: number
    costoProveedor: number
    manejaPack: boolean
    unidadesPorPack: number | null
  }
> = {}

for (const item of detallesVentaPendientes) {
  const productoId = item.productoId

  if (!deudaAgrupadaPorProducto[productoId]) {
    deudaAgrupadaPorProducto[productoId] = {
      cantidadVendida: 0,
      costoProveedor: item.producto.costoProveedor,
      manejaPack: item.producto.manejaPack,
      unidadesPorPack: item.producto.unidadesPorPack,
    }
  }

  deudaAgrupadaPorProducto[productoId].cantidadVendida += item.cantidad
}

let deudaProveedores = 0

for (const item of Object.values(deudaAgrupadaPorProducto)) {
  if (item.manejaPack && item.unidadesPorPack && item.unidadesPorPack > 0) {
    const packs = Math.ceil(item.cantidadVendida / item.unidadesPorPack)
    deudaProveedores += packs * item.unidadesPorPack * item.costoProveedor
  } else {
    deudaProveedores += item.cantidadVendida * item.costoProveedor
  }
}


    const acumuladoPorProducto = new Map<
      number,
      {
        productoId: number
        nombre: string
        codigo: string
        cantidadVendida: number
        totalVendido: number
      }
    >()

    for (const item of detallesVenta) {
      const productoId = item.productoId

      if (!acumuladoPorProducto.has(productoId)) {
        acumuladoPorProducto.set(productoId, {
          productoId,
          nombre: item.producto.nombre,
          codigo: item.producto.codigo,
          cantidadVendida: 0,
          totalVendido: 0,
        })
      }

      const actual = acumuladoPorProducto.get(productoId)!
      actual.cantidadVendida += item.cantidad
      actual.totalVendido += item.subtotal
    }

    const productosMasVendidos = Array.from(acumuladoPorProducto.values())
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 5)


    res.json({
      resumen: {
        totalVentasHoy,
        totalVentasMes,
        cantidadProductos: productos.length,
        cantidadProductosBajoStock: productosBajoStock.length,
        deudaProveedores,
      },
      productosBajoStock,
      ultimasVentas,
      productosMasVendidos,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener el resumen del dashboard',
    })
  }
})

router.get('/ventas-por-dia', async (_req, res) => {
  try {
    const ahora = new Date()
    const anio = ahora.getFullYear()
    const mes = ahora.getMonth()

    const inicioMes = new Date(anio, mes, 1, 0, 0, 0, 0)
    const finMes = new Date(anio, mes + 1, 0, 23, 59, 59, 999)

    const ventas = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: inicioMes,
          lte: finMes,
        },
      },
      orderBy: {
        fecha: 'asc',
      },
    })

    const agrupado = new Map<number, number>()

    for (const venta of ventas) {
      const dia = new Date(venta.fecha).getDate()

      if (!agrupado.has(dia)) {
        agrupado.set(dia, 0)
      }

      agrupado.set(dia, agrupado.get(dia)! + venta.total)
    }

    const resultado = Array.from(agrupado.entries()).map(([dia, total]) => ({
      dia,
      total,
    }))

    res.json(resultado)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener ventas por día',
    })
  }
})

router.get('/metodos-pago', async (_req, res) => {
  try {
    const ventas = await prisma.venta.findMany()

    const resumen = {
      EFECTIVO: 0,
      TRANSFERENCIA: 0,
      QR: 0,
      MIXTO: 0,
    }

    for (const venta of ventas) {
      const metodo = venta.metodoPago as keyof typeof resumen
      if (resumen[metodo] !== undefined) {
        resumen[metodo] += venta.total
      }
    }

    res.json(resumen)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener métodos de pago',
    })
  }
})

router.get('/productos-mas-vendidos', async (_req, res) => {
  try {
    const detallesVenta = await prisma.detalleVenta.findMany({
      include: {
        producto: true,
      },
    })

    const acumuladoPorProducto = new Map<
      number,
      {
        productoId: number
        nombre: string
        codigo: string
        cantidadVendida: number
        totalVendido: number
      }
    >()

    for (const item of detallesVenta) {
      const productoId = item.productoId

      if (!acumuladoPorProducto.has(productoId)) {
        acumuladoPorProducto.set(productoId, {
          productoId,
          nombre: item.producto.nombre,
          codigo: item.producto.codigo,
          cantidadVendida: 0,
          totalVendido: 0,
        })
      }

      const actual = acumuladoPorProducto.get(productoId)!
      actual.cantidadVendida += item.cantidad
      actual.totalVendido += item.subtotal
    }

    const productosMasVendidos = Array.from(acumuladoPorProducto.values())
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 10)

    res.json(productosMasVendidos)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener productos más vendidos',
    })
  }
})

router.get('/ultimas-ventas', async (_req, res) => {
  try {
    const ultimasVentas = await prisma.venta.findMany({
      orderBy: {
        id: 'desc',
      },
      take: 10,
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    })

    res.json(ultimasVentas)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener últimas ventas',
    })
  }
})

export default router