import * as express from 'express'
import * as cors from 'cors'
import productosRoutes from './routes/productos.routes'
import categoriasRoutes from './routes/categoria.routes'
import proveedoresRoutes from './routes/proveedores.routes'
import ingresosRoutes from './routes/ingresos.routes'
import ventasRoutes from './routes/ventas.routes'
import movimientosRoutes from './routes/movimientos.routes'
import liquidacionesRoutes from './routes/liquidaciones.routes'
import dashboardRoutes from './routes/dashboard.routes'
import reportesRoutes from './routes/reportes.routes'

const app = express()
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: corsOrigin }))
app.use(express.json())
app.use('/productos', productosRoutes)
app.use('/categorias', categoriasRoutes)
app.use('/proveedores', proveedoresRoutes)
app.use('/ingresos', ingresosRoutes)
app.use('/ventas', ventasRoutes)
app.use('/movimientos-inventario', movimientosRoutes)
app.use('/liquidaciones', liquidacionesRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/reportes', reportesRoutes)
app.get('/', (_req, res) => {
  res.json({ message: 'Backend de bodega funcionando' })
})

export default app
