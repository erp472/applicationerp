-- CreateTable
CREATE TABLE "roles" (
    "id"         UUID         NOT NULL,
    "nombre"     VARCHAR(80)  NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id"         UUID         NOT NULL,
    "nombre"     VARCHAR(80)  NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "id"         UUID         NOT NULL,
    "rolId"      UUID         NOT NULL,
    "permisoId"  UUID         NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add rolId to users
ALTER TABLE "users" ADD COLUMN "rolId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key"          ON "roles"("nombre");
CREATE UNIQUE INDEX "permisos_nombre_key"        ON "permisos"("nombre");
CREATE UNIQUE INDEX "roles_permisos_rolId_permisoId_key" ON "roles_permisos"("rolId", "permisoId");
CREATE INDEX "roles_permisos_rolId_idx"          ON "roles_permisos"("rolId");
CREATE INDEX "users_rolId_idx"                   ON "users"("rolId");

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rolId_fkey"
    FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permisoId_fkey"
    FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_rolId_fkey"
    FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
