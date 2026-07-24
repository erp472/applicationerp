-- Agrega el cajero asignado explícitamente a cada sesión auxiliar.
-- Permite al supervisor asignar un cajero específico al abrir una caja auxiliar,
-- independiente del usuario que ejecutó la apertura.
ALTER TABLE "sesiones_caja"
  ADD COLUMN IF NOT EXISTS "usuarios_idusuarios_cajero_asignado" INTEGER
    REFERENCES "usuarios"("idusuarios");

CREATE INDEX IF NOT EXISTS "idx_sesiones_cajero_asignado"
  ON "sesiones_caja" ("usuarios_idusuarios_cajero_asignado");
