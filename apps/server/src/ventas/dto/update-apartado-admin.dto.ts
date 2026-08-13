import { z } from 'zod';

export const UpdateApartadoAdminSchema = z.object({
  tamano:                z.enum(['pequeno', 'mediano', 'grande']).optional(),
  estado:                z.enum(['disponible', 'mantenimiento', 'reservado']).optional(),
  diasAlertaVencimiento: z.number().int().min(1).max(365).optional(),
});

export type UpdateApartadoAdminDto = z.infer<typeof UpdateApartadoAdminSchema>;
