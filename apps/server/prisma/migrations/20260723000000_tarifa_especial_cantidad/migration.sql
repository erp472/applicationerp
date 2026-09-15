-- CreateTable
CREATE TABLE "tarifas_especial_cantidad" (
    "idtarifas_especial_cantidad"  SERIAL         NOT NULL,
    "productos_idproductos"        INTEGER        NOT NULL,
    "min_cantidadtarifas_especial" INTEGER        NOT NULL,
    "max_cantidadtarifas_especial" INTEGER,
    "preciotarifas_especial"       DECIMAL(18,2)  NOT NULL,
    "activotarifas_especial"       BOOLEAN        NOT NULL DEFAULT true,
    "created_attarifas_especial"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_attarifas_especial"   TIMESTAMPTZ(6),

    CONSTRAINT "tarifas_especial_cantidad_pkey" PRIMARY KEY ("idtarifas_especial_cantidad")
);

-- CreateIndex
CREATE UNIQUE INDEX "tarifas_especial_cantidad_productos_idproductos_min_cantidad_key"
    ON "tarifas_especial_cantidad"("productos_idproductos", "min_cantidadtarifas_especial");

-- CreateIndex
CREATE INDEX "idx_tarifas_especial_lookup"
    ON "tarifas_especial_cantidad"("productos_idproductos", "activotarifas_especial");

-- AddForeignKey
ALTER TABLE "tarifas_especial_cantidad"
    ADD CONSTRAINT "tarifas_especial_cantidad_productos_idproductos_fkey"
    FOREIGN KEY ("productos_idproductos")
    REFERENCES "productos"("idproductos")
    ON DELETE RESTRICT ON UPDATE CASCADE;
