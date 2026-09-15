import { z } from 'zod';

export const ResolverDiferenciaSchema = z.object({
  estado:        z.enum(['aprobada', 'rechazada']),
  observaciones: z.string().max(500).optional(),
});

export type ResolverDiferenciaDto = z.infer<typeof ResolverDiferenciaSchema>;
