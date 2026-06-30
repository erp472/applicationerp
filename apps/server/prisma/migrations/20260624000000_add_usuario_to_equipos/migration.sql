-- Agrega usuarioId a equipos_autorizados para validación per-usuario
ALTER TABLE "equipos_autorizados" ADD COLUMN "usuarioId" UUID;
ALTER TABLE "equipos_autorizados" ADD COLUMN "nombre" VARCHAR(120);

ALTER TABLE "equipos_autorizados"
  ADD CONSTRAINT "equipos_autorizados_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id")
  ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX "equipos_autorizados_usuarioId_idx" ON "equipos_autorizados"("usuarioId");

-- Reemplaza el unique anterior (macAddress, sucursalId) por (macAddress, sucursalId, usuarioId)
DROP INDEX IF EXISTS "equipos_autorizados_macAddress_sucursalId_key";
CREATE UNIQUE INDEX "equipos_autorizados_macAddress_sucursalId_usuarioId_key"
  ON "equipos_autorizados"("macAddress", "sucursalId", "usuarioId");
