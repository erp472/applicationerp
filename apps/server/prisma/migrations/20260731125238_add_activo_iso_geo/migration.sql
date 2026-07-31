-- DropForeignKey
ALTER TABLE "sesiones_caja" DROP CONSTRAINT "sesiones_caja_usuarios_idusuarios_cajero_asignado_fkey";

-- DropIndex
DROP INDEX "idx_sesiones_cajero_asignado";

-- AlterTable
ALTER TABLE "ciudades" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "departamentos" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "paises" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "iso2" VARCHAR(2),
ADD COLUMN     "iso3" VARCHAR(3),
ADD COLUMN     "phonecode" VARCHAR(10),
ADD COLUMN     "region" VARCHAR(50);

-- RenameForeignKey
ALTER TABLE "diferencias_caja" RENAME CONSTRAINT "diferencias_caja_aprobador_fkey" TO "diferencias_caja_aprobador_id_fkey";

-- RenameForeignKey
ALTER TABLE "diferencias_caja" RENAME CONSTRAINT "diferencias_caja_custodio_fkey" TO "diferencias_caja_custodio_id_fkey";

-- RenameForeignKey
ALTER TABLE "diferencias_caja" RENAME CONSTRAINT "diferencias_caja_sesion_fkey" TO "diferencias_caja_sesiones_caja_idsesiones_caja_fkey";

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_usuarios_idusuarios_cajero_asignado_fkey" FOREIGN KEY ("usuarios_idusuarios_cajero_asignado") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "reposiciones_caja_codigo_remesa_key" RENAME TO "reposiciones_caja_codigo_remesareposiciones_caja_key";

-- RenameIndex
ALTER INDEX "tarifas_especial_cantidad_productos_idproductos_min_cantidad_ke" RENAME TO "tarifas_especial_cantidad_productos_idproductos_min_cantida_key";
