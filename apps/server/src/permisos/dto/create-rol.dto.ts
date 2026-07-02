import { z } from 'zod';

export const CreateRolSchema = z.object({
  nombre: z.string().min(2).max(80).trim(),
});

export type CreateRolDto = z.infer<typeof CreateRolSchema>;

export const UpdateRolSchema = CreateRolSchema.partial();
export type UpdateRolDto = z.infer<typeof UpdateRolSchema>;
