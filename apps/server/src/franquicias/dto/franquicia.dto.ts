import { z } from 'zod';

export const CrearFranquiciaSchema = z.object({
  codigo: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/, 'Solo mayúsculas, dígitos y guion bajo'),
  nombre: z.string().min(2).max(100),
  activo: z.boolean().default(true),
});

export const ActualizarFranquiciaSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  activo: z.boolean().optional(),
});

export const ActivarEnSucursalSchema = z.object({
  activo: z.boolean(),
});

export type CrearFranquiciaDto      = z.infer<typeof CrearFranquiciaSchema>;
export type ActualizarFranquiciaDto = z.infer<typeof ActualizarFranquiciaSchema>;
export type ActivarEnSucursalDto    = z.infer<typeof ActivarEnSucursalSchema>;
