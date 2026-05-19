UPDATE "Producto"
SET
  "precioVenta" = ROUND(
    (
      CASE
        WHEN "precioVentaPack" IS NOT NULL
          THEN "precioVentaPack" / COALESCE(NULLIF("unidadesPorPack", 0), 1)
        ELSE "precioVenta"
      END
    ) / 1000
  ) * 1000,
  "costoProveedor" = ROUND(
    (
      CASE
        WHEN "costoPack" IS NOT NULL
          THEN "costoPack" / COALESCE(NULLIF("unidadesPorPack", 0), 1)
        ELSE "costoProveedor"
      END
    ) / 1000
  ) * 1000;
