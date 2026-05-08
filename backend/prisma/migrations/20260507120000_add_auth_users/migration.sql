CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CAJERO');

CREATE TABLE "Usuario" (
  "id" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "email" TEXT,
  "password" TEXT NOT NULL,
  "rol" "Rol" NOT NULL DEFAULT 'CAJERO',
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
