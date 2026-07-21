import { z } from 'zod';

export const CreateCajaPadreSchema = z.object({
  sucursalId:  z.number().int().positive(),
  nombre:      z.string().min(1).max(100),
  baseGeneral: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido').optional(),
  horaReset:   z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM').optional(),
});

export type CreateCajaPadreDto = z.infer<typeof CreateCajaPadreSchema>;
