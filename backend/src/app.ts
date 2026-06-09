import express = require('express')
import cors = require('cors')
import productosRoutes from './routes/productos.routes'
import categoriasRoutes from './routes/categoria.routes'
import proveedoresRoutes from './routes/proveedores.routes'
import ingresosRoutes from './routes/ingresos.routes'
import ventasRoutes from './routes/ventas.routes'
import movimientosRoutes from './routes/movimientos.routes'
import liquidacionesRoutes from './routes/liquidaciones.routes'
import dashboardRoutes from './routes/dashboard.routes'
import reportesRoutes from './routes/reportes.routes'
import authRoutes from './modules/auth/auth.routes'
import usuariosRoutes from './modules/usuarios/usuarios.routes'
import cajaRoutes from './modules/caja/caja.routes'
import cajeroRoutes from './modules/cajero/cajero.routes'
import { authMiddleware } from './middlewares/auth.middleware'
import { roleMiddleware } from './middlewares/role.middleware'
import { Rol } from '@prisma/client'

const app = express()
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
const allowedOrigins = corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)

function isAllowedOrigin(origin: string) {
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin.includes('*')) {
      const escapedPattern = allowedOrigin
        .split('*')
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*')
      const pattern = new RegExp(`^${escapedPattern}$`)
      return pattern.test(origin)
    }

    return allowedOrigin === origin
  })
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true)
      return
    }

    callback(new Error(`Origen no permitido por CORS: ${origin}`))
  },
}))
app.use(express.json())
app.use('/auth', authRoutes)
app.use('/productos', authMiddleware, productosRoutes)
app.use('/categorias', authMiddleware, categoriasRoutes)
app.use('/proveedores', authMiddleware, roleMiddleware([Rol.ADMIN]), proveedoresRoutes)
app.use('/ingresos', authMiddleware, roleMiddleware([Rol.ADMIN]), ingresosRoutes)
app.use('/ventas', authMiddleware, roleMiddleware([Rol.ADMIN, Rol.CAJERO]), ventasRoutes)
app.use('/movimientos', authMiddleware, roleMiddleware([Rol.ADMIN, Rol.CAJERO]), movimientosRoutes)
app.use('/movimientos-inventario', authMiddleware, roleMiddleware([Rol.ADMIN, Rol.CAJERO]), movimientosRoutes)
app.use('/liquidaciones', authMiddleware, roleMiddleware([Rol.ADMIN]), liquidacionesRoutes)
app.use('/dashboard', authMiddleware, roleMiddleware([Rol.ADMIN]), dashboardRoutes)
app.use('/reportes', authMiddleware, roleMiddleware([Rol.ADMIN]), reportesRoutes)
app.use('/usuarios', usuariosRoutes)
app.use('/caja', cajaRoutes)
app.use('/cajero', cajeroRoutes)
app.get('/', (_req, res) => {
  res.json({ message: 'Backend de bodega funcionando' })
})

export default app
