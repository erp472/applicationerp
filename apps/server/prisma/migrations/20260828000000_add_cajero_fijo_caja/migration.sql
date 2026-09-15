-- Vincula un cajero fijo a cada caja POS de forma permanente,
-- independientemente de si hay sesión activa.
ALTER TABLE "cajas"
  ADD COLUMN "usuarios_idusuarios_cajero_fijo" INTEGER
  REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL;

CREATE INDEX "cajas_cajero_fijo_idx" ON "cajas"("usuarios_idusuarios_cajero_fijo");
