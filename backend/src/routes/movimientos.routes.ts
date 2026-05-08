import { Router } from 'express'
import { prisma } from '../config/prisma'

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

router.get('/', async (req, res) => {
  try {
    const { tipo, productoId, start, end, search } = req.query

    const movimientos = await prisma.movimientoInventario.findMany({
      where: {
        tipoMovimiento:
          tipo && tipo !== 'TODOS'
            ? (String(tipo) as 'ENTRADA' | 'SALIDA' | 'AJUSTE')
            : undefined,

        productoId:
          productoId && productoId !== 'TODOS'
            ? Number(productoId)
            : undefined,

        createdAt: getDateRange(
          start ? String(start) : undefined,
          end ? String(end) : undefined
        ),

        producto: search
          ? {
              OR: [
                {
                  nombre: {
                    contains: String(search),
                    mode: 'insensitive',
                  },
                },
                {
                  codigo: {
                    contains: String(search),
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        producto: {
          include: {
            categoria: true,
            proveedor: true,
          },
        },
      },
    })

    res.json(movimientos)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Error al obtener movimientos de inventario',
    })
  }
})

export default router
