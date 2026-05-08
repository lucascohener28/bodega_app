import { MetodoPago, TipoMovimientoCaja } from '@prisma/client'
import { prisma } from '../../config/prisma'

export function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start, end }
}

export function toMoneyInt(value: unknown) {
  return Math.round(Number(value) || 0)
}

export async function getVentasDelDia(range = getTodayRange()) {
  const { start, end } = range

  return prisma.venta.findMany({
    where: {
      fecha: {
        gte: start,
        lt: end,
      },
    },
    orderBy: {
      fecha: 'desc',
    },
    include: {
      detalles: {
        include: {
          producto: {
            select: {
              nombre: true,
            },
          },
        },
      },
    },
  })
}

export function calcularTotalesPorMetodo(
  ventas: Array<{ metodoPago: MetodoPago; total: number }>
) {
  return ventas.reduce(
    (acc, venta) => {
      const total = toMoneyInt(venta.total)

      if (venta.metodoPago === 'EFECTIVO') acc.efectivo += total
      if (venta.metodoPago === 'QR') acc.qr += total
      if (venta.metodoPago === 'TRANSFERENCIA') acc.transferencia += total
      if (venta.metodoPago === 'MIXTO') acc.mixto += total

      return acc
    },
    {
      efectivo: 0,
      qr: 0,
      transferencia: 0,
      mixto: 0,
    }
  )
}

export function calcularTotalesMovimientos(
  movimientos: Array<{ tipo: TipoMovimientoCaja; monto: number }>
) {
  return movimientos.reduce(
    (acc, movimiento) => {
      const monto = toMoneyInt(movimiento.monto)

      if (movimiento.tipo === 'INGRESO') acc.ingresos += monto
      if (movimiento.tipo === 'EGRESO') acc.egresos += monto
      if (movimiento.tipo === 'RETIRO') acc.retiros += monto

      return acc
    },
    {
      ingresos: 0,
      egresos: 0,
      retiros: 0,
    }
  )
}

export async function getCajaAbierta() {
  return prisma.cajaDiaria.findFirst({
    where: {
      estado: 'ABIERTA',
    },
    orderBy: {
      abiertaEn: 'desc',
    },
    include: {
      abiertaPor: {
        select: {
          id: true,
          nombre: true,
          username: true,
        },
      },
      movimientos: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })
}

export function mapCajaEstado(caja: Awaited<ReturnType<typeof getCajaAbierta>>) {
  if (!caja) {
    return {
      estado: 'CERRADA' as const,
    }
  }

  return {
    estado: 'ABIERTA' as const,
    cajaId: caja.id,
    montoInicial: caja.montoInicial,
    abiertaEn: caja.abiertaEn,
    abiertaPor: caja.abiertaPor,
    movimientos: caja.movimientos,
  }
}

export async function getCajaById(id: string) {
  return prisma.cajaDiaria.findUnique({
    where: { id },
    include: {
      abiertaPor: {
        select: {
          id: true,
          nombre: true,
          username: true,
        },
      },
      cerradaPor: {
        select: {
          id: true,
          nombre: true,
          username: true,
        },
      },
      movimientos: {
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          creadoPor: {
            select: {
              id: true,
              nombre: true,
              username: true,
            },
          },
        },
      },
    },
  })
}

export async function buildCajaDetalle(id: string) {
  const caja = await getCajaById(id)

  if (!caja) {
    return null
  }

  const start = new Date(caja.abiertaEn)
  const end = caja.cerradaEn ? new Date(caja.cerradaEn) : new Date()
  const ventas = await getVentasDelDia({ start, end })
  const metodosPago = calcularTotalesPorMetodo(ventas)
  const movimientos = calcularTotalesMovimientos(caja.movimientos)
  const totalEsperado =
    caja.totalEsperado ??
    caja.montoInicial +
      metodosPago.efectivo +
      movimientos.ingresos -
      movimientos.egresos -
      movimientos.retiros

  return {
    caja,
    resumen: {
      ventasEfectivo: caja.estado === 'CERRADA' ? caja.totalEfectivo : metodosPago.efectivo,
      ventasQR: caja.estado === 'CERRADA' ? caja.totalQR : metodosPago.qr,
      ventasTransferencia:
        caja.estado === 'CERRADA' ? caja.totalTransferencia : metodosPago.transferencia,
      ventasMixto: caja.estado === 'CERRADA' ? caja.totalMixto : metodosPago.mixto,
      ingresosCaja: movimientos.ingresos,
      egresosCaja: movimientos.egresos,
      retirosCaja: movimientos.retiros,
      totalEsperado,
      diferencia: caja.montoFinal != null ? caja.montoFinal - totalEsperado : caja.diferencia,
    },
    ventas: ventas.map((venta) => ({
      id: venta.id,
      fecha: venta.fecha,
      total: venta.total,
      metodoPago: venta.metodoPago,
      productos: venta.detalles.map((detalle) => ({
        nombre: detalle.producto.nombre,
        cantidad: detalle.cantidad,
        subtotal: detalle.subtotal,
      })),
    })),
  }
}
