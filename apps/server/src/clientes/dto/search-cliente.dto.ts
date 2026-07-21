import { z } from 'zod';

export const SearchClienteSchema = z.object({
  tipoDocumento:   z.enum(['cedula', 'pasaporte', 'tarjeta_identidad', 'cedula_extranjeria', 'nit']).optional(),
  numeroDocumento: z.string().min(3).optional(),
  nombre:          z.string().min(2).optional(),
  tipoClienteId:   z.coerce.number().int().positive().optional(),
  limit:           z.coerce.number().int().min(1).max(100).default(20),
  offset:          z.coerce.number().int().min(0).default(0),
});

export type SearchClienteDto = z.infer<typeof SearchClienteSchema>;
