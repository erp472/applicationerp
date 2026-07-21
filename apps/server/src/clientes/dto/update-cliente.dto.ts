import { z } from 'zod';

export const UpdateClienteSchema = z.object({
  nombre:        z.string().min(1).max(150).optional(),
  apellido:      z.string().max(150).nullable().optional(),
  email:         z.string().email().max(200).nullable().optional(),
  telefono:      z.string().min(7).max(20).nullable().optional(),
  direccion:     z.string().max(500).nullable().optional(),
  ciudad:        z.string().max(100).nullable().optional(),
  codigoPostal:  z.string().max(20).nullable().optional(),
  tipoClienteId: z.number().int().positive().nullable().optional(),
  nivelSisben:   z.number().int().min(1).max(4).nullable().optional(),
  activo:        z.boolean().optional(),
});

export type UpdateClienteDto = z.infer<typeof UpdateClienteSchema>;
