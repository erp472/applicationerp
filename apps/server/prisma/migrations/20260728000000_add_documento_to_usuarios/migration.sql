-- AlterTable: agregar tipo_documento y numero_documento a usuarios (nullable)
ALTER TABLE "usuarios"
  ADD COLUMN "tipo_documentousuarios"   "tipo_documento_identidad",
  ADD COLUMN "numero_documentousuarios" VARCHAR(30);
