ALTER TABLE "Producto"
ADD COLUMN "precioVentaPack" DOUBLE PRECISION,
ADD COLUMN "costoPack" DOUBLE PRECISION;

UPDATE "Producto"
SET
  "precioVentaPack" = CASE
    WHEN "manejaPack" = true AND "unidadesPorPack" IS NOT NULL AND "unidadesPorPack" > 0
      THEN "precioVenta" * "unidadesPorPack"
    ELSE "precioVenta"
  END,
  "costoPack" = CASE
    WHEN "manejaPack" = true AND "unidadesPorPack" IS NOT NULL AND "unidadesPorPack" > 0
      THEN "costoProveedor" * "unidadesPorPack"
    ELSE "costoProveedor"
  END;
