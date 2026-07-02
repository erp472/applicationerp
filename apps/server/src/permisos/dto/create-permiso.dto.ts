import { z } from 'zod';

export const CreatePermisoSchema = z.object({
  nombre: z.string().min(2).max(80).trim(),
});

export type CreatePermisoDto = z.infer<typeof CreatePermisoSchema>;

export const UpdatePermisoSchema = CreatePermisoSchema.partial();
export type UpdatePermisoDto = z.infer<typeof UpdatePermisoSchema>;
