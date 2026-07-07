import { z } from 'zod';

export const UpdateComercioSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  nit:    z.string().min(6).max(30).optional(),
  activo: z.boolean().optional(),
});

export type UpdateComercioDto = z.infer<typeof UpdateComercioSchema>;
