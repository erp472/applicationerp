-- Secuencia dedicada para el consecutivo de guías.
-- Antes se derivaba de MAX(idenvios), lo que colisiona cuando una venta individual
-- y una confirmación de lote masivo insertan envíos de forma concurrente.
CREATE SEQUENCE IF NOT EXISTS "envios_guia_seq" AS BIGINT START WITH 1;

SELECT setval('envios_guia_seq', GREATEST((SELECT COALESCE(MAX(idenvios), 0) FROM envios), 1));
