-- Soft delete en tablas base (nombres correctos de la BD)
ALTER TABLE "sucursales"          ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "usuarios"            ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "equipos_autorizados" ADD COLUMN "deletedAt" TIMESTAMP(3);
