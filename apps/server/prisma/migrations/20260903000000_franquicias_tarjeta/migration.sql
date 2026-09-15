-- Catálogo de franquicias de tarjeta (parametrizable por Tesorería)
CREATE TABLE "franquicias" (
    "idfranquicias"         SERIAL       NOT NULL,
    "codigofranquicias"     VARCHAR(20)  NOT NULL,
    "nombrefranquicias"     VARCHAR(100) NOT NULL,
    "activofranquicias"     BOOLEAN      NOT NULL DEFAULT true,
    "created_atfranquicias" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_atfranquicias" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atfranquicias" TIMESTAMPTZ(6),

    CONSTRAINT "franquicias_pkey" PRIMARY KEY ("idfranquicias")
);

CREATE UNIQUE INDEX "franquicias_codigofranquicias_key" ON "franquicias"("codigofranquicias");

-- Activación por sucursal
CREATE TABLE "franquicias_sucursal" (
    "sucursales_idsucursales"    INTEGER NOT NULL,
    "franquicias_idfranquicias"  INTEGER NOT NULL,
    "activofranquicias_sucursal" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "franquicias_sucursal_pkey" PRIMARY KEY ("sucursales_idsucursales", "franquicias_idfranquicias")
);

ALTER TABLE "franquicias_sucursal"
    ADD CONSTRAINT "franquicias_sucursal_sucursales_idsucursales_fkey"
    FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "franquicias_sucursal"
    ADD CONSTRAINT "franquicias_sucursal_franquicias_idfranquicias_fkey"
    FOREIGN KEY ("franquicias_idfranquicias") REFERENCES "franquicias"("idfranquicias")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Datos de la tarjeta en el movimiento de caja (baucher para el arqueo)
ALTER TABLE "movimientos_caja"
    ADD COLUMN "franquicias_idfranquicias"      INTEGER,
    ADD COLUMN "codigo_vouchermovimientos_caja" VARCHAR(30);

ALTER TABLE "movimientos_caja"
    ADD CONSTRAINT "movimientos_caja_franquicias_idfranquicias_fkey"
    FOREIGN KEY ("franquicias_idfranquicias") REFERENCES "franquicias"("idfranquicias")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_mov_caja_franquicia" ON "movimientos_caja"("franquicias_idfranquicias");

-- Franquicias base
INSERT INTO "franquicias" ("codigofranquicias", "nombrefranquicias") VALUES
    ('VISA',       'Visa'),
    ('MASTERCARD', 'Mastercard'),
    ('AMEX',       'American Express'),
    ('DINERS',     'Diners Club'),
    ('CODENSA',    'Codensa'),
    ('CREDENCIAL', 'Credencial');

-- Habilitadas en todas las sucursales existentes
INSERT INTO "franquicias_sucursal" ("sucursales_idsucursales", "franquicias_idfranquicias")
SELECT s."idsucursales", f."idfranquicias" FROM "sucursales" s CROSS JOIN "franquicias" f;
