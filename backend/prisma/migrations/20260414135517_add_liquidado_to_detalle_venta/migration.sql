-- AlterTable
ALTER TABLE "DetalleVenta" ADD COLUMN     "liquidado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "liquidadoAt" TIMESTAMP(3);
