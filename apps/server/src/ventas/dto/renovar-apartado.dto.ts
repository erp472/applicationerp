import { z } from 'zod';

export const RenovarApartadoSchema = z.object({
  meses: z.number().int().min(1).max(36),
});

export type RenovarApartadoDto = z.infer<typeof RenovarApartadoSchema>;
