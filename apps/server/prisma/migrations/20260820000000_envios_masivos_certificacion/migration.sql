-- Soporte de certificación en envíos masivos
-- 1. Almacenar el valor de certificación calculado por cada item del lote
ALTER TABLE "envios_masivos_items"
  ADD COLUMN "valor_certificacionenvios_masivos_items" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- 2. Acumular el total de certificación a nivel de lote (igual que total_estampillas)
ALTER TABLE "envios_masivos"
  ADD COLUMN "total_certificacionenvios_masivos" DECIMAL(18,2) NOT NULL DEFAULT 0;
