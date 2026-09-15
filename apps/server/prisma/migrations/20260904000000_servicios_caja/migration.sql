-- Operaciones habilitadas por caja. Ausencia de fila = servicio activo.
CREATE TABLE "servicios_caja" (
    "cajas_idcajas"            INTEGER      NOT NULL,
    "codigoservicios_caja"     VARCHAR(50)  NOT NULL,
    "activoservicios_caja"     BOOLEAN      NOT NULL DEFAULT true,
    "updated_atservicios_caja" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicios_caja_pkey" PRIMARY KEY ("cajas_idcajas", "codigoservicios_caja")
);

ALTER TABLE "servicios_caja"
    ADD CONSTRAINT "servicios_caja_cajas_idcajas_fkey"
    FOREIGN KEY ("cajas_idcajas") REFERENCES "cajas"("idcajas")
    ON UPDATE CASCADE ON DELETE CASCADE;
