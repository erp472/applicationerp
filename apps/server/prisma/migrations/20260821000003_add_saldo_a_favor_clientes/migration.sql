-- AlterTable
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "saldo_a_favclientes" DECIMAL(18,2) NOT NULL DEFAULT 0;
