-- Migración: Envíos Postales Masivos (preporteado corporativo)
-- Permite registrar un lote de envíos con un remitente compartido
-- y múltiples destinatarios, con cotización en tiempo real.

-- Enum estado del lote
CREATE TYPE "estado_lote_masivo" AS ENUM ('borrador', 'confirmado', 'anulado');

-- Tabla cabecera del lote
CREATE TABLE "envios_masivos" (
    "idenvios_masivos"                       SERIAL PRIMARY KEY,
    "sucursales_idsucursales"                INTEGER NOT NULL,
    "sesiones_caja_idsesiones_caja"          INTEGER,
    "usuarios_idusuarios"                    INTEGER NOT NULL,
    "clientes_idclientes"                    INTEGER,
    "servicios_idservicios"                  INTEGER NOT NULL,
    "remitente_nombreenvios_masivos"         VARCHAR(300) NOT NULL,
    "remitente_documentoenvios_masivos"      VARCHAR(30),
    "remitente_emailenvios_masivos"          VARCHAR(200),
    "remitente_telefonoenvios_masivos"       VARCHAR(20),
    "remitente_direccionenvios_masivos"      TEXT,
    "remitente_ciudadenvios_masivos"         VARCHAR(100),
    "remitente_cpenvios_masivos"             VARCHAR(20),
    "total_itemsenvios_masivos"              INTEGER NOT NULL DEFAULT 0,
    "total_peso_kgenvios_masivos"            DECIMAL(10,3) NOT NULL DEFAULT 0,
    "total_estampillasenvios_masivos"        DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valor_totalenvios_masivos"              DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estadoenvios_masivos"                   "estado_lote_masivo" NOT NULL DEFAULT 'borrador',
    "observacionesenvios_masivos"            TEXT,
    "created_atenvios_masivos"               TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_atenvios_masivos"               TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "fk_envios_masivos_sucursal"
        FOREIGN KEY ("sucursales_idsucursales")
        REFERENCES "sucursales"("idsucursales"),

    CONSTRAINT "fk_envios_masivos_sesion"
        FOREIGN KEY ("sesiones_caja_idsesiones_caja")
        REFERENCES "sesiones_caja"("idsesiones_caja"),

    CONSTRAINT "fk_envios_masivos_usuario"
        FOREIGN KEY ("usuarios_idusuarios")
        REFERENCES "usuarios"("idusuarios"),

    CONSTRAINT "fk_envios_masivos_cliente"
        FOREIGN KEY ("clientes_idclientes")
        REFERENCES "clientes"("idclientes"),

    CONSTRAINT "fk_envios_masivos_servicio"
        FOREIGN KEY ("servicios_idservicios")
        REFERENCES "servicios"("idservicios")
);

CREATE INDEX "idx_envios_masivos_sucursal_fecha"
    ON "envios_masivos"("sucursales_idsucursales", "created_atenvios_masivos");

CREATE INDEX "idx_envios_masivos_estado"
    ON "envios_masivos"("estadoenvios_masivos");

-- Tabla de items (un destinatario por fila)
CREATE TABLE "envios_masivos_items" (
    "idenvios_masivos_items"                          SERIAL PRIMARY KEY,
    "envios_masivos_idenvios_masivos"                 INTEGER NOT NULL,
    "numero_filaenvios_masivos_items"                 INTEGER NOT NULL,
    "destinatario_nombreenvios_masivos_items"         VARCHAR(300) NOT NULL,
    "destinatario_documentoenvios_masivos_items"      VARCHAR(30),
    "destinatario_emailenvios_masivos_items"          VARCHAR(200),
    "destinatario_telefonoenvios_masivos_items"       VARCHAR(20),
    "destinatario_direccionenvios_masivos_items"      TEXT,
    "destinatario_ciudadenvios_masivos_items"         VARCHAR(100),
    "destinatario_paisenvios_masivos_items"           VARCHAR(5) NOT NULL DEFAULT 'CO',
    "destinatario_cpenvios_masivos_items"             VARCHAR(20),
    "peso_fisico_kgenvios_masivos_items"              DECIMAL(8,3) NOT NULL,
    "peso_tarificado_kgenvios_masivos_items"          DECIMAL(8,3) NOT NULL,
    "valor_servicioenvios_masivos_items"              DECIMAL(18,2) NOT NULL,
    "valor_estampillasenvios_masivos_items"           DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valor_totalenvios_masivos_items"                 DECIMAL(18,2) NOT NULL,
    "contenidoenvios_masivos_items"                   VARCHAR(200),
    "observacionesenvios_masivos_items"               VARCHAR(500),
    "envios_idenvios"                                 INTEGER UNIQUE,

    CONSTRAINT "fk_envios_masivos_items_lote"
        FOREIGN KEY ("envios_masivos_idenvios_masivos")
        REFERENCES "envios_masivos"("idenvios_masivos")
        ON DELETE CASCADE,

    CONSTRAINT "fk_envios_masivos_items_envio"
        FOREIGN KEY ("envios_idenvios")
        REFERENCES "envios"("idenvios")
);

CREATE INDEX "idx_envios_masivos_items_lote"
    ON "envios_masivos_items"("envios_masivos_idenvios_masivos");
