-- Add documento field to direcciones_frecuentes
ALTER TABLE "direcciones_frecuentes"
  ADD COLUMN IF NOT EXISTS "documentodirfrecuentes" VARCHAR(50);

CREATE INDEX IF NOT EXISTS "idx_dir_frecuentes_doc_rol"
  ON "direcciones_frecuentes"("documentodirfrecuentes", "roldireccionesfrecuentes");
