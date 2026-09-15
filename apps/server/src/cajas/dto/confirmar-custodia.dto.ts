import { z } from 'zod';

export const ConfirmarCustodiaSchema = z.object({
  montoRecibido: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido'),
  observaciones: z.string().max(500).optional(),
});

export type ConfirmarCustodiaDto = z.infer<typeof ConfirmarCustodiaSchema>;
