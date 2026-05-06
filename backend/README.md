# Backend - Deploy en Render

Backend Express + TypeScript + Prisma conectado a PostgreSQL/Supabase.

## Configuracion en Render

- Root directory: `backend`
- Build command: `npm install && npm run prisma:generate && npm run build`
- Start command: `npm start`
- Node version: `>=20.19.0`

## Variables de entorno

Configurar en Render:

```env
DATABASE_URL=
DIRECT_URL=
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

Para produccion, cambiar `CORS_ORIGIN` por la URL del frontend en Render.
Si necesitas permitir mas de un origen, separalos por coma:

```env
CORS_ORIGIN=http://localhost:5173,https://tu-frontend.onrender.com
```

## Comandos utiles

```bash
npx prisma generate
npm run prisma:generate
npm run build
npm start
```

Las migraciones no se ejecutan automaticamente en el start. Para produccion,
usar `npx prisma migrate deploy` solo cuando corresponda aplicar migraciones.

## Si falla el build

Verificar que las variables de entorno esten cargadas en Render antes del deploy.
Prisma 7 necesita Node `>=20.19.0`; este requisito queda definido en
`package.json`.

Si Render muestra `Could not find Prisma Schema`, confirmar que el servicio tenga
`Root Directory` configurado como `backend` y usar el build command documentado:
`npm install && npm run prisma:generate && npm run build`.
