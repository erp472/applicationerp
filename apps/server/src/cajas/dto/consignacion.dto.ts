import { z } from 'zod';

export const ConsignacionSchema = z.object({
  medio:        z.enum(['banco', 'transportadora']),
  bancoNombre:  z.string().max(100).optional(),
  tipoCuenta:   z.enum(['ahorros', 'corriente']).optional(),
  numeroCuenta: z.string().max(30).optional(),
  monto:        z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido'),
  proposito:    z.string().max(300).optional(),
  soporteUrl:   z.string().url().max(500).optional(),
});

export type ConsignacionDto = z.infer<typeof ConsignacionSchema>;

export const AprobarConsignacionSchema = z.object({
  estado: z.enum(['aprobada', 'rechazada']),
});

export type AprobarConsignacionDto = z.infer<typeof AprobarConsignacionSchema>;
