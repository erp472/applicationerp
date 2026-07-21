import { z } from 'zod';

export const AnularVentaSchema = z.object({
  motivo: z.string().min(5).max(300),
});

export type AnularVentaDto = z.infer<typeof AnularVentaSchema>;
