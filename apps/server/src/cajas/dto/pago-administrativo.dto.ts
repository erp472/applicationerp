import { z } from 'zod';

export const PagoAdministrativoSchema = z.object({
  numeroCaso:  z.string().max(50).optional(),
  tipoPago:    z.string().min(2).max(100),
  nit:         z.string().max(30).optional(),
  lugar:       z.string().max(200).optional(),
  observacion: z.string().max(500).optional(),
  valor:       z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido'),
});

export type PagoAdministrativoDto = z.infer<typeof PagoAdministrativoSchema>;
