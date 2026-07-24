import { z } from 'zod';

export const ContratarApartadoSchema = z.object({
  sucursalId:     z.number().int().positive(),
  numeroApartado: z.string().min(1).max(20),
  tamano:         z.enum(['pequeno', 'mediano', 'grande']),
  meses:          z.number().int().min(1).max(36),
  fechaInicio:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  comentarios:    z.string().max(500).optional(),
});

export type ContratarApartadoDto = z.infer<typeof ContratarApartadoSchema>;
