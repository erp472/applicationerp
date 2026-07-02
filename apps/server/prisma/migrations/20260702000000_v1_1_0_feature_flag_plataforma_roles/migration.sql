-- v1.1.0 — Feature flags: plataforma (web/tauri/all) + restricción por roles

-- CreateEnum
CREATE TYPE "plataforma_feature_flag" AS ENUM ('all', 'web', 'tauri');

-- AlterTable: agregar columna plataforma a feature_flags
ALTER TABLE "feature_flags"
  ADD COLUMN "plataformafeature_flags" "plataforma_feature_flag" NOT NULL DEFAULT 'all';

-- CreateTable: restricción de roles por feature flag
-- Si no hay filas para un flag → accesible a todos los roles
CREATE TABLE "feature_flag_roles" (
    "feature_flags_idfeature_flags" INTEGER NOT NULL,
    "roles_idroles"                 INTEGER NOT NULL,

    CONSTRAINT "feature_flag_roles_pkey" PRIMARY KEY ("feature_flags_idfeature_flags","roles_idroles")
);

-- AddForeignKey
ALTER TABLE "feature_flag_roles"
  ADD CONSTRAINT "feature_flag_roles_feature_flags_idfeature_flags_fkey"
  FOREIGN KEY ("feature_flags_idfeature_flags")
  REFERENCES "feature_flags"("idfeature_flags")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_roles"
  ADD CONSTRAINT "feature_flag_roles_roles_idroles_fkey"
  FOREIGN KEY ("roles_idroles")
  REFERENCES "roles"("idroles")
  ON DELETE CASCADE ON UPDATE CASCADE;
