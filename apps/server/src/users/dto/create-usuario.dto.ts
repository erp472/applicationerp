import { z } from 'zod';

export const RolUsuarioEnum = z.enum([
  'CAJERO',
  'ADMINISTRATIVO',
  'TESORERIA',
  'INVENTARIOS',
  'SUPERVISOR_REGIONAL',
  'ADMIN_NACIONAL',
  'ADMIN_SISTEMA',
]);

export const CreateUsuarioSchema = z.object({
  nombre: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  rol: RolUsuarioEnum,
  sucursal_id: z.string().uuid().optional().nullable(),
});

export type CreateUsuarioDto = z.infer<typeof CreateUsuarioSchema>;
