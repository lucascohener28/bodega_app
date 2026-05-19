import 'dotenv/config'

const VENTA_ID = 47
const LIQUIDACION_ID = 18
const CONFIRM_FLAG = 'CONFIRM_DELETE_VENTA_47_LIQ_18'

type Summary = {
  venta: {
    id: number
    total: number
    fecha: Date
    detalles: number
  } | null
  liquidacion: {
    id: number
    totalPagar: number
    fecha: Date
    detalles: number
  } | null
  detallesVentaLiquidacion: number
  movimientosInventarioVenta: number
}

function printSummary(summary: Summary) {
  console.log('Resumen previo al borrado:')

  if (summary.venta) {
    console.log(`- Venta encontrada: #${summary.venta.id}`)
    console.log(`  Total venta: ${summary.venta.total}`)
    console.log(`  Fecha venta: ${summary.venta.fecha.toISOString()}`)
    console.log(`  Detalles de venta: ${summary.venta.detalles}`)
  } else {
    console.warn(`- Venta #${VENTA_ID}: no encontrada`)
  }

  if (summary.liquidacion) {
    console.log(`- Liquidacion encontrada: #${summary.liquidacion.id}`)
    console.log(`  Total liquidacion: ${summary.liquidacion.totalPagar}`)
    console.log(`  Fecha liquidacion: ${summary.liquidacion.fecha.toISOString()}`)
    console.log(`  Detalles de liquidacion: ${summary.liquidacion.detalles}`)
  } else {
    console.warn(`- Liquidacion #${LIQUIDACION_ID}: no encontrada`)
  }

  console.log(
    `- Detalles de venta vinculados a liquidacion #${LIQUIDACION_ID}: ${summary.detallesVentaLiquidacion}`,
  )
  console.log(
    `- Movimientos de inventario directos de venta #${VENTA_ID}: ${summary.movimientosInventarioVenta}`,
  )
}

async function main() {
  if (process.env[CONFIRM_FLAG] !== 'true') {
    throw new Error(`Para ejecutar este borrado, agrega ${CONFIRM_FLAG}=true`)
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no esta definida')
  }

  const { prisma } = await import('../config/prisma.js')

  try {
    const [venta, liquidacion, detallesVentaLiquidacion, movimientosInventarioVenta] =
      await Promise.all([
        prisma.venta.findUnique({
          where: { id: VENTA_ID },
          include: {
            _count: {
              select: { detalles: true },
            },
          },
        }),
        prisma.liquidacion.findUnique({
          where: { id: LIQUIDACION_ID },
          include: {
            _count: {
              select: { detalles: true },
            },
          },
        }),
        prisma.detalleVenta.count({
          where: { liquidacionId: LIQUIDACION_ID },
        }),
        prisma.movimientoInventario.count({
          where: {
            referenciaTipo: 'VENTA',
            referenciaId: VENTA_ID,
          },
        }),
      ])

    printSummary({
      venta: venta
        ? {
            id: venta.id,
            total: venta.total,
            fecha: venta.fecha,
            detalles: venta._count.detalles,
          }
        : null,
      liquidacion: liquidacion
        ? {
            id: liquidacion.id,
            totalPagar: liquidacion.totalPagar,
            fecha: liquidacion.fecha,
            detalles: liquidacion._count.detalles,
          }
        : null,
      detallesVentaLiquidacion,
      movimientosInventarioVenta,
    })

    if (!venta && !liquidacion) {
      console.warn('No se encontro la venta ni la liquidacion. No hay nada para borrar.')
      return
    }

    const result = await prisma.$transaction(async (tx) => {
      const deletedDetalleLiquidacion = liquidacion
        ? await tx.detalleLiquidacion.deleteMany({
            where: { liquidacionId: LIQUIDACION_ID },
          })
        : { count: 0 }

      const clearedDetalleVentaLiquidacion = await tx.detalleVenta.updateMany({
        where: { liquidacionId: LIQUIDACION_ID },
        data: {
          liquidacionId: null,
          liquidado: false,
          liquidadoAt: null,
        },
      })

      const deletedLiquidacion = liquidacion
        ? await tx.liquidacion.deleteMany({
            where: { id: LIQUIDACION_ID },
          })
        : { count: 0 }

      const deletedMovimientosVenta = await tx.movimientoInventario.deleteMany({
        where: {
          referenciaTipo: 'VENTA',
          referenciaId: VENTA_ID,
        },
      })

      const deletedDetalleVenta = venta
        ? await tx.detalleVenta.deleteMany({
            where: { ventaId: VENTA_ID },
          })
        : { count: 0 }

      const deletedVenta = venta
        ? await tx.venta.deleteMany({
            where: { id: VENTA_ID },
          })
        : { count: 0 }

      return {
        deletedDetalleLiquidacion: deletedDetalleLiquidacion.count,
        clearedDetalleVentaLiquidacion: clearedDetalleVentaLiquidacion.count,
        deletedLiquidacion: deletedLiquidacion.count,
        deletedMovimientosVenta: deletedMovimientosVenta.count,
        deletedDetalleVenta: deletedDetalleVenta.count,
        deletedVenta: deletedVenta.count,
      }
    })

    console.log('Borrado completado:')
    console.log(`- DetalleLiquidacion eliminados: ${result.deletedDetalleLiquidacion}`)
    console.log(`- Relaciones DetalleVenta/Liquidacion limpiadas: ${result.clearedDetalleVentaLiquidacion}`)
    console.log(`- Liquidacion eliminada: ${result.deletedLiquidacion}`)
    console.log(`- MovimientosInventario directos eliminados: ${result.deletedMovimientosVenta}`)
    console.log(`- DetalleVenta eliminados: ${result.deletedDetalleVenta}`)
    console.log(`- Venta eliminada: ${result.deletedVenta}`)
    console.log('Operacion eliminada correctamente sin revertir stock ni modificar productos.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
