import { z } from 'zod';

export const UpdateCajaPadreSchema = z.object({
  nombre:      z.string().min(1).max(100).optional(),
  baseGeneral: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido').optional(),
  horaReset:   z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM').optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'Se requiere al menos un campo' });

export type UpdateCajaPadreDto = z.infer<typeof UpdateCajaPadreSchema>;
