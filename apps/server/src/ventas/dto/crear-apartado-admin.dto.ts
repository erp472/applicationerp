import { z } from 'zod';

export const CrearApartadoAdminSchema = z.object({
  sucursalId:            z.number().int().positive(),
  numero:                z.string().min(1).max(20),
  tamano:                z.enum(['pequeno', 'mediano', 'grande']).default('pequeno'),
  diasAlertaVencimiento: z.number().int().min(1).max(365).default(30),
});

export type CrearApartadoAdminDto = z.infer<typeof CrearApartadoAdminSchema>;
