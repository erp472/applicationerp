-- ============================================================
-- Soft delete en entidades base + permisos + feature flags
-- ============================================================

-- Soft delete en tablas existentes
ALTER TABLE "branches"          ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "users"             ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "authorized_devices" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- FeatureFlagEntorno enum
CREATE TYPE "FeatureFlagEntorno" AS ENUM ('all', 'dev', 'staging', 'prod');

-- Tabla de permisos
CREATE TABLE "permissions" (
    "id"          SERIAL NOT NULL,
    "codigo"      VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(200),
    "modulo"      VARCHAR(50)  NOT NULL,
    "deletedAt"   TIMESTAMP(3),
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "permissions_codigo_key" ON "permissions"("codigo");

-- Tabla de roles_permisos (rol es el enum RolUsuario)
CREATE TABLE "role_permissions" (
    "rol"       "RolUsuario" NOT NULL,
    "permisoId" INTEGER      NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("rol", "permisoId")
);
ALTER TABLE "role_permissions"
    ADD CONSTRAINT "role_permissions_permisoId_fkey"
    FOREIGN KEY ("permisoId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabla de feature flags
CREATE TABLE "feature_flags" (
    "id"          SERIAL NOT NULL,
    "codigo"      VARCHAR(100)         NOT NULL,
    "descripcion" VARCHAR(200),
    "activo"      BOOLEAN              NOT NULL DEFAULT false,
    "entorno"     "FeatureFlagEntorno" NOT NULL DEFAULT 'all',
    "createdAt"   TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)         NOT NULL,
    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "feature_flags_codigo_key" ON "feature_flags"("codigo");
