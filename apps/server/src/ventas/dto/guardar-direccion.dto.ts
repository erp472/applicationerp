import { z } from 'zod';

export const GuardarDireccionSchema = z.object({
  rol:          z.enum(['remitente', 'destinatario']),
  nombre:       z.string().min(1).max(200),
  empresa:      z.string().max(200).optional(),
  telefono:     z.string().max(30).optional(),
  email:        z.string().email().optional().or(z.literal('')),
  direccion:    z.string().max(500).optional(),
  ciudad:       z.string().max(100).optional(),
  departamento: z.string().max(100).optional(),
  pais:         z.string().length(2).default('CO'),
  codigoPostal: z.string().max(20).optional(),
  documento:    z.string().max(30).optional(),
});

export type GuardarDireccionDto = z.infer<typeof GuardarDireccionSchema>;
