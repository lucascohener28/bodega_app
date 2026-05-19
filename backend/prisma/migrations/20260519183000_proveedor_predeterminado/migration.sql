ALTER TABLE "Proveedor" ADD COLUMN "predeterminado" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Proveedor"
SET "predeterminado" = false
WHERE "predeterminado" = true;

INSERT INTO "Proveedor" ("nombre", "telefono", "activo", "predeterminado", "createdAt", "updatedAt")
SELECT 'Ña Kaito', NULL, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Proveedor" WHERE lower("nombre") = lower('Ña Kaito')
);

UPDATE "Proveedor"
SET "activo" = true,
    "predeterminado" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = (
  SELECT "id"
  FROM "Proveedor"
  WHERE lower("nombre") = lower('Ña Kaito')
  ORDER BY "id" ASC
  LIMIT 1
);

UPDATE "Proveedor"
SET "predeterminado" = false,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "predeterminado" = true
  AND "id" <> (
    SELECT "id"
    FROM "Proveedor"
    WHERE lower("nombre") = lower('Ña Kaito')
    ORDER BY "id" ASC
    LIMIT 1
  );

CREATE UNIQUE INDEX "Proveedor_unico_predeterminado_activo"
ON "Proveedor" ("predeterminado")
WHERE "predeterminado" = true AND "activo" = true;
