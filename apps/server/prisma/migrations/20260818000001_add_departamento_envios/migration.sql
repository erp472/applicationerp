ALTER TABLE "envios"
  ADD COLUMN IF NOT EXISTS "remitente_departamentoenvios"    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "destinatario_departamentoenvios" VARCHAR(100);
