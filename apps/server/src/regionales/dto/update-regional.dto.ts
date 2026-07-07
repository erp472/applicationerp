import { z } from 'zod';

export const UpdateRegionalSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  activo: z.boolean().optional(),
});

export type UpdateRegionalDto = z.infer<typeof UpdateRegionalSchema>;
