-- AlterTable: add pdf_guia_path to envios for guide PDF registry
ALTER TABLE "envios" ADD COLUMN "pdf_guia_pathenvios" VARCHAR(500);
