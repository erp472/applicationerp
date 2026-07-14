-- AlterEnum
ALTER TYPE "tipo_caja" ADD VALUE 'pagos';

-- AlterEnum
ALTER TYPE "tipo_movimiento_caja" ADD VALUE 'pago_administrativo';

-- AlterTable
ALTER TABLE "giros" ADD COLUMN     "beneficiario_huellagiros" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "beneficiario_pepgiros" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "beneficiario_sospechosogiros" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sesiones_caja" ADD COLUMN     "arqueo_denominacionessesiones_caja" JSONB;
