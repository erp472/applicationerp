import { z } from 'zod';

export const IniciarVentaSchema = z.object({
  tipoDocumento:   z.string().min(1),
  numeroDocumento: z.string().min(1).max(30),
});

export type IniciarVentaDto = z.infer<typeof IniciarVentaSchema>;
