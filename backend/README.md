# Backend - Deploy en Render

Backend Express + TypeScript + Prisma conectado a PostgreSQL/Supabase.

## Configuracion en Render

- Root directory: `backend`
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npm start`

## Variables de entorno

Configurar en Render:

```env
DATABASE_URL=
DIRECT_URL=
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

Para produccion, cambiar `CORS_ORIGIN` por la URL del frontend en Vercel.
Si necesitas permitir mas de un origen, separalos por coma:

```env
CORS_ORIGIN=http://localhost:5173,https://tu-frontend.vercel.app
```

## Comandos utiles

```bash
npx prisma generate
npm run build
npm start
```

Las migraciones no se ejecutan automaticamente en el start. Para produccion,
usar `npx prisma migrate deploy` solo cuando corresponda aplicar migraciones.
