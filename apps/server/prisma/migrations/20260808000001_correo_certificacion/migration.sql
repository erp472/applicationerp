-- Agrega tarifa de certificación al catálogo de servicios.
-- Para servicios CON CERTI este valor se suma al total como adicional explícito.
ALTER TABLE "servicios" ADD COLUMN "tarifa_certificacionservicios" DECIMAL(18,2);

-- Almacena el cobro de certificación calculado en cada envío.
ALTER TABLE "envios" ADD COLUMN "valor_certificacionenvios" DECIMAL(18,2) NOT NULL DEFAULT 0;
