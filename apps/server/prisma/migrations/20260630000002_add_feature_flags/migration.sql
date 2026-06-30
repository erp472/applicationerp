-- CreateEnum
CREATE TYPE "EntornoFeatureFlag" AS ENUM ('all', 'dev', 'staging', 'prod');

-- CreateTable
CREATE TABLE "feature_flags" (
    "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
    "codigo"      VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(200),
    "activo"      BOOLEAN      NOT NULL DEFAULT false,
    "entorno"     "EntornoFeatureFlag" NOT NULL DEFAULT 'all',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_codigo_key" ON "feature_flags"("codigo");
