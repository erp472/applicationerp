import { z } from 'zod';

export const AperturaDirectaSchema = z.object({
  baseAsignada: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido'),
  equipoMac:   z.string().max(30).optional(),
});

export type AperturaDirectaDto = z.infer<typeof AperturaDirectaSchema>;
