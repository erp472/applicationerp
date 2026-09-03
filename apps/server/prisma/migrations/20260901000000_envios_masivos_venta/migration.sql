-- Enlaza el lote masivo con la venta del carrito que lo cobra
ALTER TABLE "envios_masivos" ADD COLUMN "ventas_idventas" INTEGER;

ALTER TABLE "envios_masivos"
  ADD CONSTRAINT "envios_masivos_ventas_idventas_fkey"
  FOREIGN KEY ("ventas_idventas") REFERENCES "ventas"("idventas")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_envios_masivos_venta" ON "envios_masivos"("ventas_idventas");
