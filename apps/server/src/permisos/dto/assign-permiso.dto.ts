import { z } from 'zod';

export const AssignPermisoSchema = z.object({
  permisoId: z.string().uuid(),
});

export type AssignPermisoDto = z.infer<typeof AssignPermisoSchema>;
