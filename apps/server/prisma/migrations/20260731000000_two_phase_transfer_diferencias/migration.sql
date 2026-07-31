-- RF-4.01: Add en_transito / confirmada to estado_aprobacion enum
ALTER TYPE "estado_aprobacion" ADD VALUE IF NOT EXISTS 'en_transito';
ALTER TYPE "estado_aprobacion" ADD VALUE IF NOT EXISTS 'confirmada';

-- RF-4.02: Add codigo_remesa to reposiciones_caja (immutable receipt hash)
ALTER TABLE "reposiciones_caja"
  ADD COLUMN "codigo_remesareposiciones_caja" TEXT;
CREATE UNIQUE INDEX "reposiciones_caja_codigo_remesa_key"
  ON "reposiciones_caja"("codigo_remesareposiciones_caja");

-- RF-3.03: Create diferencias_caja table (pending-approval difference ledger)
CREATE TABLE "diferencias_caja" (
  "iddiferencias_caja"            SERIAL          NOT NULL,
  "sesiones_caja_idsesiones_caja" INTEGER         NOT NULL,
  "tipo_diferencia"               VARCHAR(10)     NOT NULL,
  "monto_diferencia"              DECIMAL(18,2)   NOT NULL,
  "custodio_id"                   INTEGER,
  "estado"        "estado_aprobacion"             NOT NULL DEFAULT 'pendiente',
  "aprobador_id"                  INTEGER,
  "observaciones"                 TEXT,
  "created_at"                    TIMESTAMPTZ(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "diferencias_caja_pkey" PRIMARY KEY ("iddiferencias_caja")
);

ALTER TABLE "diferencias_caja"
  ADD CONSTRAINT "diferencias_caja_sesion_fkey"
  FOREIGN KEY ("sesiones_caja_idsesiones_caja")
  REFERENCES "sesiones_caja"("idsesiones_caja")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "diferencias_caja"
  ADD CONSTRAINT "diferencias_caja_custodio_fkey"
  FOREIGN KEY ("custodio_id")
  REFERENCES "usuarios"("idusuarios")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "diferencias_caja"
  ADD CONSTRAINT "diferencias_caja_aprobador_fkey"
  FOREIGN KEY ("aprobador_id")
  REFERENCES "usuarios"("idusuarios")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_diferencias_caja_sesion"
  ON "diferencias_caja"("sesiones_caja_idsesiones_caja");
