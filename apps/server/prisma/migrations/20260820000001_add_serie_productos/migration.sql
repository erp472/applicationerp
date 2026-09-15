-- Add serie field to productos for stamp series (Banco de la Moneda, Salto de Tequendama, Laupat)
-- and filatelia collectible series (Carpeta de Marqués, etc.)
ALTER TABLE "productos" ADD COLUMN IF NOT EXISTS "serieproductos" VARCHAR(100);
