-- AlterTable
ALTER TABLE "DetalleVenta" ADD COLUMN     "liquidacionId" INTEGER;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "manejaPack" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unidadesPorPack" INTEGER;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "Liquidacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
