UPDATE "Producto"
SET
  "precioVenta" = CASE
    WHEN "precioVentaPack" IS NOT NULL
      THEN "precioVentaPack" / COALESCE(NULLIF("unidadesPorPack", 0), 1)
    ELSE "precioVenta"
  END,
  "costoProveedor" = CASE
    WHEN "costoPack" IS NOT NULL
      THEN "costoPack" / COALESCE(NULLIF("unidadesPorPack", 0), 1)
    ELSE "costoProveedor"
  END;
