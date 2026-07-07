import { z } from 'zod';

export const RolEnum = z.enum([
  'CAJERO',
  'ADMINISTRATIVO',
  'TESORERIA',
  'INVENTARIOS',
  'SUPERVISOR_REGIONAL',
  'ADMIN_NACIONAL',
  'ADMIN_SISTEMA',
]);

export const CreateUserSchema = z.object({
  nombre:         z.string().min(2).max(200),
  email:          z.string().email(),
  password:       z.string().min(8).max(100),
  rol:            RolEnum,
  sucursal_id:    z.coerce.number().int().positive().optional().nullable(),
  telefono:       z.string().max(20).optional().nullable(),
  pais_id:        z.coerce.number().int().positive().optional().nullable(),
  departamento_id: z.coerce.number().int().positive().optional().nullable(),
  ciudad_id:      z.coerce.number().int().positive().optional().nullable(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
