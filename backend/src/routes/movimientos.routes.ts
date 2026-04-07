import * as express from 'express'
import { prisma } from '../config/prisma'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const movimientos = await prisma.movimientoInventario.findMany({
      orderBy: {
        id: 'desc',
      },
      include: {
        producto: true,
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