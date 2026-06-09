# Deploy en Vercel

Objetivo:

- Frontend: Vercel
- Backend/API: Vercel
- Database: Supabase
- Render: mantener activo hasta verificar Vercel

## Proyectos recomendados

Usar dos proyectos Vercel separados desde el mismo repositorio:

1. `bodega-frontend`
   - Root Directory: `.`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. `bodega-backend`
   - Root Directory: `backend`
   - Framework Preset: `Other` o `Express` si aparece disponible
   - Build Command: `npm run build`
   - Express entrypoint: `src/app.ts`

Vercel soporta Express exportado como `default` desde `src/app.ts`, por eso no hace falta mover rutas a `/api`.

## Variables de entorno

Backend/API en Vercel:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
DB_POOL_MAX=1
JWT_SECRET=...
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,https://TU-FRONTEND.vercel.app
```

Frontend en Vercel:

```env
VITE_API_URL=https://TU-BACKEND.vercel.app
```

No uses slash final en `VITE_API_URL`.

## Orden seguro

1. Crear primero el proyecto backend en Vercel.
2. Cargar variables de entorno del backend usando las mismas credenciales Supabase que usa producción.
3. Deployar backend.
4. Probar:

```bash
curl https://TU-BACKEND.vercel.app/
curl -X POST https://TU-BACKEND.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"Osvaldo\",\"password\":\"Cohete018\"}"
```

5. Crear el proyecto frontend en Vercel.
6. Cargar `VITE_API_URL=https://TU-BACKEND.vercel.app`.
7. Agregar la URL final del frontend a `CORS_ORIGIN` del backend.
8. Redeployar backend para aplicar CORS.
9. Deployar frontend.

## Validacion antes de apagar Render

Probar en Vercel:

- Login admin
- Login cajero
- Productos
- Ventas
- Ingresos
- Caja
- Liquidaciones
- Dashboard
- Reportes
- Movimientos
- Vista mobile
- PWA/acceso directo

Mientras se prueba:

- No apagar Render.
- No cambiar DNS principal si lo hubiera.
- No borrar variables ni servicios de Render.
- No ejecutar `prisma migrate reset`.
- No borrar ni truncar tablas.
