ALTER TABLE "envios_masivos" ADD COLUMN IF NOT EXISTS "cobrado_atenvios_masivos" TIMESTAMPTZ;
ALTER TABLE "envios_masivos" ADD COLUMN IF NOT EXISTS "medio_pago_cobroenvios_masivos" VARCHAR(30);
