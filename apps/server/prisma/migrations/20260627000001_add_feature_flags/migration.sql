-- CreateEnum
CREATE TYPE "FeatureFlagModo" AS ENUM ('PRODUCCION', 'AB_TEST', 'INACTIVO');

-- CreateTable
CREATE TABLE "feature_flags" (
    "id"          UUID                NOT NULL,
    "nombre"      VARCHAR(80)         NOT NULL,
    "modo"        "FeatureFlagModo"   NOT NULL DEFAULT 'PRODUCCION',
    "descripcion" VARCHAR(200),
    "createdAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)        NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_nombre_key" ON "feature_flags"("nombre");
