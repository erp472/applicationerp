-- CreateTable: direcciones_frecuentes (tabla omitida en migración anterior)
CREATE TABLE IF NOT EXISTS "direcciones_frecuentes" (
  "iddireccionesfrecuentes"       SERIAL PRIMARY KEY,
  "clientes_idclientes"           INTEGER NOT NULL,
  "roldireccionesfrecuentes"      VARCHAR(20) NOT NULL,
  "nombredireccionesfrecuentes"   VARCHAR(300) NOT NULL,
  "empresadireccionesfrecuentes"  VARCHAR(300),
  "telefonodirfrecuentes"         VARCHAR(20),
  "emaildirfrecuentes"            VARCHAR(200),
  "direcciondirfrecuentes"        TEXT,
  "ciudaddirfrecuentes"           VARCHAR(100),
  "departamentodirfrecuentes"     VARCHAR(100),
  "paisdirfrecuentes"             VARCHAR(5) NOT NULL DEFAULT 'CO',
  "codigo_postaldirfrecuentes"    VARCHAR(20),
  "usosdirfrecuentes"             INTEGER NOT NULL DEFAULT 1,
  "ultimo_usodirfrecuentes"       TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "created_atdirfrecuentes"       TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "direcciones_frecuentes_clientes_idclientes_fkey"
    FOREIGN KEY ("clientes_idclientes") REFERENCES "clientes"("idclientes") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_dir_frecuentes_cliente_rol"
  ON "direcciones_frecuentes"("clientes_idclientes", "roldireccionesfrecuentes");

-- Add documento field to direcciones_frecuentes
ALTER TABLE "direcciones_frecuentes"
  ADD COLUMN IF NOT EXISTS "documentodirfrecuentes" VARCHAR(50);

CREATE INDEX IF NOT EXISTS "idx_dir_frecuentes_doc_rol"
  ON "direcciones_frecuentes"("documentodirfrecuentes", "roldireccionesfrecuentes");
