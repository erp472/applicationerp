import { z } from 'zod';

export const UpdateCajaSchema = z.object({
  cajaPadreId:  z.number().int().positive().optional(),
  codigo:       z.string().min(1).max(20).optional(),
  nombre:       z.string().min(1).max(100).optional(),
  tipo:         z.enum(['menor', 'general', 'pos', 'pagos']).optional(),
  baseDia:      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido').optional(),
  limiteAlerta: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido').optional().nullable(),
  activo:       z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'Se requiere al menos un campo' });

export type UpdateCajaDto = z.infer<typeof UpdateCajaSchema>;
