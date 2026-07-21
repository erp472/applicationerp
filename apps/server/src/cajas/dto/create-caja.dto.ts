import { z } from 'zod';

export const CreateCajaSchema = z.object({
  sucursalId:   z.number().int().positive(),
  cajaPadreId:  z.number().int().positive().optional(),
  codigo:       z.string().min(1).max(20),
  nombre:       z.string().min(1).max(100),
  tipo:         z.enum(['menor', 'general', 'pos', 'pagos']),
  baseDia:      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido').optional(),
  limiteAlerta: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido').optional(),
});

export type CreateCajaDto = z.infer<typeof CreateCajaSchema>;
