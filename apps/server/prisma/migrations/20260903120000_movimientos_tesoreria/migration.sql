-- Historial del tramo comercio → regional. Hasta ahora cajas_padres.base_general era
-- una columna suelta sin trazabilidad: nadie sabía quién asignó el dinero al punto,
-- con qué baucher ni de dónde venía.

CREATE TYPE "tipo_movimiento_tesoreria" AS ENUM ('apertura', 'ingreso', 'egreso');

CREATE TABLE "movimientos_tesoreria" (
    "idmovimientos_tesoreria"                SERIAL NOT NULL,
    "cajas_padres_idcajas_padres"            INTEGER NOT NULL,
    "usuarios_idusuarios"                    INTEGER NOT NULL,
    "tipomovimientos_tesoreria"              "tipo_movimiento_tesoreria" NOT NULL,
    "montomovimientos_tesoreria"             DECIMAL(18,2) NOT NULL,
    "codigo_aprobacionmovimientos_tesoreria" VARCHAR(40) NOT NULL,
    "descripcionmovimientos_tesoreria"       TEXT NOT NULL,
    "saldo_resultantemovimientos_tesoreria"  DECIMAL(18,2) NOT NULL,
    "created_atmovimientos_tesoreria"        TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_tesoreria_pkey" PRIMARY KEY ("idmovimientos_tesoreria")
);

-- El baucher del comercio es la llave anti-duplicado: impide registrar dos veces el mismo giro.
CREATE UNIQUE INDEX "movimientos_tesoreria_codigo_aprobacionmovimientos_tesoreri_key"
    ON "movimientos_tesoreria" ("codigo_aprobacionmovimientos_tesoreria");

CREATE INDEX "idx_mov_tesoreria_punto"
    ON "movimientos_tesoreria" ("cajas_padres_idcajas_padres", "created_atmovimientos_tesoreria");

ALTER TABLE "movimientos_tesoreria"
    ADD CONSTRAINT "movimientos_tesoreria_cajas_padres_idcajas_padres_fkey"
    FOREIGN KEY ("cajas_padres_idcajas_padres") REFERENCES "cajas_padres"("idcajas_padres")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "movimientos_tesoreria"
    ADD CONSTRAINT "movimientos_tesoreria_usuarios_idusuarios_fkey"
    FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios")
    ON DELETE RESTRICT ON UPDATE CASCADE;
