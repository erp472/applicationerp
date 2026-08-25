-- Soporte multi-origen en envíos masivos
-- 1. Hacer nullable el remitente del lote (ahora es el remitente "por defecto")
ALTER TABLE "envios_masivos" ALTER COLUMN "remitente_nombreenvios_masivos" DROP NOT NULL;

-- 2. Agregar columnas de remitente propio por item (todos opcionales)
ALTER TABLE "envios_masivos_items"
  ADD COLUMN "remitente_nombreenvios_masivos_items"    VARCHAR(300),
  ADD COLUMN "remitente_documentoenvios_masivos_items" VARCHAR(30),
  ADD COLUMN "remitente_emailenvios_masivos_items"     VARCHAR(200),
  ADD COLUMN "remitente_telefonoenvios_masivos_items"  VARCHAR(20),
  ADD COLUMN "remitente_direccionenvios_masivos_items" TEXT,
  ADD COLUMN "remitente_ciudadenvios_masivos_items"    VARCHAR(100),
  ADD COLUMN "remitente_cpenvios_masivos_items"        VARCHAR(20);
