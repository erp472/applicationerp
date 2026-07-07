import { z } from 'zod';

export const CreateRegionalSchema = z.object({
  comercio_id: z.coerce.number().int().positive(),
  codigo:      z.string().min(2).max(20),
  nombre:      z.string().min(2).max(200),
});

export type CreateRegionalDto = z.infer<typeof CreateRegionalSchema>;
