import { z } from 'zod';

export const CambioCustodiaSchema = z.object({
  sesionDestinoId: z.number().int().positive(),
  monto:           z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido'),
  motivo:          z.string().max(300).optional(),
});

export type CambioCustodiaDto = z.infer<typeof CambioCustodiaSchema>;
