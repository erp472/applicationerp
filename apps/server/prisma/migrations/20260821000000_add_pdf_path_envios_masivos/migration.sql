-- Add PDF path field to envios_masivos table
ALTER TABLE "envios_masivos" ADD COLUMN IF NOT EXISTS "pdf_guias_pathenvios_masivos" TEXT;
