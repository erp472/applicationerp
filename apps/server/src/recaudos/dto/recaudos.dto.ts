import { z } from 'zod';

export const RegistrarRecaudoSchema = z.object({
  convenioId:     z.number().int().positive(),
  referenciaPago: z.string().min(1).max(100),
  codigoBarras:   z.string().max(200).optional(),
  monto:          z.number().positive(),
  comisionOperador: z.number().nonnegative().default(0),
});

export type RegistrarRecaudoDto = z.infer<typeof RegistrarRecaudoSchema>;
