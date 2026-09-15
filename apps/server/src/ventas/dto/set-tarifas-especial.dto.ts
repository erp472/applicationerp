import { z } from 'zod';

export const SetTarifasEspecialSchema = z.array(
  z.object({
    minCantidad: z.number().int().min(0),
    maxCantidad: z.number().int().positive().nullable().optional().default(null),
    precio:      z.number().min(0),
  }),
).min(0);

export type SetTarifasEspecialDto = z.infer<typeof SetTarifasEspecialSchema>;
