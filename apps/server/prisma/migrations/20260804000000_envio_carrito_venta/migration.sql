-- AlterEnum
ALTER TYPE "estado_envio" ADD VALUE 'pendiente';

-- AlterTable: agrega ventaId a envios para vincular envíos en carrito a una venta
ALTER TABLE "envios" ADD COLUMN "ventas_idventas" INTEGER;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_ventas_idventas_fkey"
  FOREIGN KEY ("ventas_idventas") REFERENCES "ventas"("idventas") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "idx_envios_venta" ON "envios"("ventas_idventas");
