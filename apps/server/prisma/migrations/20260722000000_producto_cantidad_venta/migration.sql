-- AlterTable: límites de cantidad por transacción en productos
ALTER TABLE "productos"
  ADD COLUMN "cantidad_minima_ventaproductos" INTEGER,
  ADD COLUMN "cantidad_maxima_ventaproductos" INTEGER;
