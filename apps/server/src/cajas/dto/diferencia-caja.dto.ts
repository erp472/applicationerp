import { z } from 'zod';

export const DiferenciaCajaSchema = z.object({
  tipo:         z.enum(['diferencia_sobrante', 'diferencia_faltante']),
  valor:        z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido'),
  causa:        z.string().min(3).max(200),
  observacion:  z.string().max(500).optional(),
});

export type DiferenciaCajaDto = z.infer<typeof DiferenciaCajaSchema>;
