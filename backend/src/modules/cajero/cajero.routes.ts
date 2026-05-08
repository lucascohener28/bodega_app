import { Router } from 'express'
import { Rol } from '@prisma/client'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'
import {
  calcularTotalesPorMetodo,
  getCajaAbierta,
  getVentasDelDia,
  mapCajaEstado,
} from '../caja/caja.service'

const router = Router()

router.use(authMiddleware, roleMiddleware([Rol.ADMIN, Rol.CAJERO]))

router.get('/dashboard', async (_req, res) => {
  try {
    const ventas = await getVentasDelDia()
    const cajaAbierta = await getCajaAbierta()
    const metodosPago = calcularTotalesPorMetodo(ventas)
    const ventasHoy = ventas.reduce((sum, venta) => sum + Math.round(venta.total), 0)

    res.json({
      ventasHoy,
      cantidadVentasHoy: ventas.length,
      metodosPago,
      caja: mapCajaEstado(cajaAbierta),
      ultimasVentas: ventas.slice(0, 10).map((venta) => ({
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
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener dashboard del cajero' })
  }
})

export default router
