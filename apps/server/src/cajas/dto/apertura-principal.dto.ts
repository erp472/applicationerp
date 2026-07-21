import { z } from 'zod';

export const AperturaPrincipalSchema = z.object({
  montoApertura: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido'),
  equipoMac:     z.string().optional(),
});

export type AperturaPrincipalDto = z.infer<typeof AperturaPrincipalSchema>;
