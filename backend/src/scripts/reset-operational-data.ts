import 'dotenv/config'

const CONFIRM_RESET = process.env.CONFIRM_RESET
const DATABASE_URL = process.env.DATABASE_URL

type DeleteResult = {
  label: string
  count: number
}

async function deleteBlock(
  results: DeleteResult[],
  label: string,
  action: () => Promise<{ count: number }>,
) {
  const deleted = await action()
  results.push({ label, count: deleted.count })
}

async function main() {
  console.warn('ADVERTENCIA: este script elimina datos operativos/de prueba.')
  console.warn('No elimina usuarios, roles, migraciones ni estructura de base de datos.')

  if (CONFIRM_RESET !== 'true') {
    throw new Error('Para ejecutar este reset, agregá CONFIRM_RESET=true')
  }

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL no está definida')
  }

  const { prisma } = await import('../config/prisma.js')

  try {
    const results = await prisma.$transaction(async (tx) => {
      const deleted: DeleteResult[] = []

      await deleteBlock(deleted, 'Movimientos de caja', () => tx.movimientoCaja.deleteMany())
      await deleteBlock(deleted, 'Caja diaria', () => tx.cajaDiaria.deleteMany())

      await deleteBlock(deleted, 'Detalles de liquidaciones', () => tx.detalleLiquidacion.deleteMany())
      await deleteBlock(deleted, 'Detalles de ventas', () => tx.detalleVenta.deleteMany())
      await deleteBlock(deleted, 'Liquidaciones', () => tx.liquidacion.deleteMany())

      await deleteBlock(deleted, 'Detalles de ingresos de mercadería', () =>
        tx.detalleIngresoMercaderia.deleteMany(),
      )
      await deleteBlock(deleted, 'Ingresos de mercadería', () => tx.ingresoMercaderia.deleteMany())

      await deleteBlock(deleted, 'Movimientos de inventario', () =>
        tx.movimientoInventario.deleteMany(),
      )
      await deleteBlock(deleted, 'Ventas', () => tx.venta.deleteMany())

      await deleteBlock(deleted, 'Productos', () => tx.producto.deleteMany())
      await deleteBlock(deleted, 'Categorías', () => tx.categoria.deleteMany())
      await deleteBlock(deleted, 'Proveedores', () => tx.proveedor.deleteMany())

      return deleted
    })

    for (const result of results) {
      console.log(`${result.label}: ${result.count} registros eliminados`)
    }

    console.log('Base operativa limpiada correctamente. Lista para carga real.')
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
