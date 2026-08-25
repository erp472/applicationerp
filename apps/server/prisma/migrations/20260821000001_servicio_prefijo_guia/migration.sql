-- Prefijo de guía UPU S10 por servicio (ej: 'RA' para correo certificado nacional)
-- Null para servicios sin rastreo S10 (correo normal, apartados, etc.)
ALTER TABLE "servicios"
  ADD COLUMN "prefijo_guia_servicios" VARCHAR(5);
