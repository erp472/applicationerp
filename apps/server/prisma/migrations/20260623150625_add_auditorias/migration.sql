-- CreateEnum
CREATE TYPE "AuditAccion" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PRINT', 'EXPORT');

-- CreateEnum
CREATE TYPE "AuditResultado" AS ENUM ('OK', 'ERROR');

-- CreateTable
CREATE TABLE "auditorias" (
    "id" UUID NOT NULL,
    "trace_id" VARCHAR(32),
    "span_id" VARCHAR(16),
    "usuario_id" UUID,
    "accion" "AuditAccion" NOT NULL,
    "entidad" VARCHAR(64) NOT NULL,
    "entidad_id" VARCHAR(64),
    "datos_antes" JSONB,
    "datos_despues" JSONB,
    "ip_origen" VARCHAR(45),
    "resultado" "AuditResultado" NOT NULL DEFAULT 'OK',
    "error_msg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditorias_trace_id_idx" ON "auditorias"("trace_id");

-- CreateIndex
CREATE INDEX "auditorias_usuario_id_created_at_idx" ON "auditorias"("usuario_id", "created_at");

-- CreateIndex
CREATE INDEX "auditorias_entidad_entidad_id_idx" ON "auditorias"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "auditorias_created_at_idx" ON "auditorias"("created_at");
