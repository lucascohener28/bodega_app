CREATE TYPE "EstadoCaja" AS ENUM ('ABIERTA', 'CERRADA');
CREATE TYPE "TipoMovimientoCaja" AS ENUM ('INGRESO', 'EGRESO', 'RETIRO');

CREATE TABLE "CajaDiaria" (
  "id" TEXT NOT NULL,
  "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "estado" "EstadoCaja" NOT NULL DEFAULT 'ABIERTA',
  "montoInicial" INTEGER NOT NULL,
  "montoFinal" INTEGER,
  "totalEfectivo" INTEGER NOT NULL DEFAULT 0,
  "totalQR" INTEGER NOT NULL DEFAULT 0,
  "totalTransferencia" INTEGER NOT NULL DEFAULT 0,
  "totalMixto" INTEGER NOT NULL DEFAULT 0,
  "totalEsperado" INTEGER,
  "diferencia" INTEGER,
  "observacionApertura" TEXT,
  "observacionCierre" TEXT,
  "abiertaPorId" TEXT NOT NULL,
  "cerradaPorId" TEXT,
  "abiertaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cerradaEn" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CajaDiaria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MovimientoCaja" (
  "id" TEXT NOT NULL,
  "cajaId" TEXT NOT NULL,
  "tipo" "TipoMovimientoCaja" NOT NULL,
  "monto" INTEGER NOT NULL,
  "concepto" TEXT NOT NULL,
  "observacion" TEXT,
  "creadoPorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CajaDiaria_estado_idx" ON "CajaDiaria"("estado");
CREATE INDEX "CajaDiaria_abiertaPorId_idx" ON "CajaDiaria"("abiertaPorId");
CREATE INDEX "CajaDiaria_fecha_idx" ON "CajaDiaria"("fecha");
CREATE INDEX "MovimientoCaja_cajaId_idx" ON "MovimientoCaja"("cajaId");

ALTER TABLE "CajaDiaria" ADD CONSTRAINT "CajaDiaria_abiertaPorId_fkey" FOREIGN KEY ("abiertaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CajaDiaria" ADD CONSTRAINT "CajaDiaria_cerradaPorId_fkey" FOREIGN KEY ("cerradaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "CajaDiaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
