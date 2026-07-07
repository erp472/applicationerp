import { z } from 'zod';

export const CreateComercioSchema = z.object({
  codigo: z.string().min(2).max(20),
  nombre: z.string().min(2).max(200),
  nit:    z.string().min(6).max(30),
});

export type CreateComercioDto = z.infer<typeof CreateComercioSchema>;
