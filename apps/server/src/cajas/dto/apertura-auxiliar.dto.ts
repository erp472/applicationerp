import { z } from 'zod';

export const AperturaAuxiliarSchema = z.object({
  cajaAuxiliarId:   z.number().int().positive(),
  baseAsignada:     z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido'),
  equipoMac:        z.string().max(30).optional(),
  cajeroAsignadoId: z.number().int().positive().optional(),
});

export type AperturaAuxiliarDto = z.infer<typeof AperturaAuxiliarSchema>;
