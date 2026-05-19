import type { PrismaClient } from '@prisma/client'

type PrismaLike = PrismaClient

type ProductoLiquidacion = {
  costoProveedor: number
  costoPack: number | null
  manejaPack: boolean
  unidadesPorPack: number | null
}

export function calcularSubtotalLiquidacion(
  cantidadVendida: number,
  producto: ProductoLiquidacion
) {
  if (
    producto.manejaPack &&
    producto.unidadesPorPack &&
    producto.unidadesPorPack > 0
  ) {
    const packs = Math.ceil(cantidadVendida / producto.unidadesPorPack)
    const costoPack =
      typeof producto.costoPack === 'number' && Number.isFinite(producto.costoPack)
        ? producto.costoPack
        : producto.unidadesPorPack * producto.costoProveedor

    return packs * costoPack
  }

  return cantidadVendida * producto.costoProveedor
}

export async function calcularDeudaPendienteProveedor(
  prisma: PrismaLike,
  proveedorId: number
) {
  const ventasPendientes = await prisma.detalleVenta.findMany({
    where: {
      liquidado: false,
      producto: {
        proveedorId,
      },
    },
    include: {
      producto: true,
    },
  })

  return ventasPendientes.reduce(
    (acc, item) => acc + calcularSubtotalLiquidacion(item.cantidad, item.producto),
    0
  )
}

export async function calcularDeudaPendienteTotal(prisma: PrismaLike) {
  const ventasPendientes = await prisma.detalleVenta.findMany({
    where: {
      liquidado: false,
    },
    include: {
      producto: true,
    },
  })

  return ventasPendientes.reduce(
    (acc, item) => acc + calcularSubtotalLiquidacion(item.cantidad, item.producto),
    0
  )
}
