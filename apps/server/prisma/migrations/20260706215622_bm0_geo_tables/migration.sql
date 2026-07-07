/*
  Warnings:

  - You are about to drop the column `ciudadsucursales` on the `sucursales` table. All the data in the column will be lost.
  - You are about to drop the column `departamentosucursales` on the `sucursales` table. All the data in the column will be lost.
  - You are about to drop the `feature_flags_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feature_flags_usuarios` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "feature_flags_roles" DROP CONSTRAINT "feature_flags_roles_feature_flags_idfeature_flags_fkey";

-- DropForeignKey
ALTER TABLE "feature_flags_roles" DROP CONSTRAINT "feature_flags_roles_roles_idroles_fkey";

-- DropForeignKey
ALTER TABLE "feature_flags_usuarios" DROP CONSTRAINT "feature_flags_usuarios_feature_flags_idfeature_flags_fkey";

-- DropForeignKey
ALTER TABLE "feature_flags_usuarios" DROP CONSTRAINT "feature_flags_usuarios_usuarios_idusuarios_fkey";

-- AlterTable
ALTER TABLE "sucursales" DROP COLUMN "ciudadsucursales",
DROP COLUMN "departamentosucursales",
ADD COLUMN     "ciudades_idciudades" INTEGER,
ADD COLUMN     "departamentos_iddepartamentos" INTEGER,
ADD COLUMN     "paises_idpaises" INTEGER;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "ciudades_idciudades" INTEGER,
ADD COLUMN     "departamentos_iddepartamentos" INTEGER,
ADD COLUMN     "paises_idpaises" INTEGER,
ADD COLUMN     "telefonousuarios" VARCHAR(20);

-- DropTable
DROP TABLE "feature_flags_roles";

-- DropTable
DROP TABLE "feature_flags_usuarios";

-- CreateTable
CREATE TABLE "paises" (
    "idpaises" INTEGER NOT NULL,
    "nombrepaises" VARCHAR(100) NOT NULL,

    CONSTRAINT "paises_pkey" PRIMARY KEY ("idpaises")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "iddepartamentos" INTEGER NOT NULL,
    "paises_idpaises" INTEGER NOT NULL,
    "nombredepartamentos" VARCHAR(100) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("iddepartamentos")
);

-- CreateTable
CREATE TABLE "ciudades" (
    "idciudades" INTEGER NOT NULL,
    "departamentos_iddepartamentos" INTEGER NOT NULL,
    "nombreciudades" VARCHAR(100) NOT NULL,

    CONSTRAINT "ciudades_pkey" PRIMARY KEY ("idciudades")
);

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_paises_idpaises_fkey" FOREIGN KEY ("paises_idpaises") REFERENCES "paises"("idpaises") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciudades" ADD CONSTRAINT "ciudades_departamentos_iddepartamentos_fkey" FOREIGN KEY ("departamentos_iddepartamentos") REFERENCES "departamentos"("iddepartamentos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_paises_idpaises_fkey" FOREIGN KEY ("paises_idpaises") REFERENCES "paises"("idpaises") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_departamentos_iddepartamentos_fkey" FOREIGN KEY ("departamentos_iddepartamentos") REFERENCES "departamentos"("iddepartamentos") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_ciudades_idciudades_fkey" FOREIGN KEY ("ciudades_idciudades") REFERENCES "ciudades"("idciudades") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_paises_idpaises_fkey" FOREIGN KEY ("paises_idpaises") REFERENCES "paises"("idpaises") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_departamentos_iddepartamentos_fkey" FOREIGN KEY ("departamentos_iddepartamentos") REFERENCES "departamentos"("iddepartamentos") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_ciudades_idciudades_fkey" FOREIGN KEY ("ciudades_idciudades") REFERENCES "ciudades"("idciudades") ON DELETE SET NULL ON UPDATE CASCADE;
