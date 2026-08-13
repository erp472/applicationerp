-- Mejoras de realismo: mínimo de seguro postal y dimensiones máximas por servicio
ALTER TABLE servicios
  ADD COLUMN IF NOT EXISTS minimo_seguro_postal numeric(18,2),
  ADD COLUMN IF NOT EXISTS alto_max_cm          numeric(8,1),
  ADD COLUMN IF NOT EXISTS ancho_max_cm         numeric(8,1),
  ADD COLUMN IF NOT EXISTS largo_max_cm         numeric(8,1);

-- Factor volumétrico default real: 5000 nacional (Colombia/4-72), 6000 internacional (UPU)
-- Los servicios existentes ya tienen el valor correcto en la BD si fue configurado vía UI.
-- Solo actualizamos los que aún tienen el valor de placeholder 2500 y son internacionales.
UPDATE servicios
SET factor_volumetricoservicios = 6000
WHERE tiposervicios IN ('internacional_ms', 'internacional_courier')
  AND factor_volumetricoservicios = 2500
  AND deleted_atservicios IS NULL;
