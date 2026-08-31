-- "Dice contener" de la guía postal: se capturaba en el DTO pero no existía columna donde guardarlo.
ALTER TABLE "envios"
  ADD COLUMN "contenidoenvios" VARCHAR(200);

-- Las guías ya generadas se sirven desde disco vía pdf_guia_pathenvios, así que
-- seguirían mostrando los datos incompletos. Limpiar la ruta fuerza a regenerarlas.
UPDATE "envios" SET "pdf_guia_pathenvios" = NULL WHERE "pdf_guia_pathenvios" IS NOT NULL;
