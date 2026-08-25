-- Add 'confirmada' value to estado_venta enum
ALTER TYPE "estado_venta" ADD VALUE IF NOT EXISTS 'confirmada' BEFORE 'anulada';
