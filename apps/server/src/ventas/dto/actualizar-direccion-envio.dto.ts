import { z } from 'zod';

export const ActualizarDireccionEnvioSchema = z.object({
  destinatarioNombre:      z.string().min(1).max(300).optional(),
  destinatarioDocumento:   z.string().max(30).optional().nullable(),
  destinatarioTelefono:    z.string().max(20).optional().nullable(),
  destinatarioEmail:       z.string().email().max(200).optional().nullable(),
  destinatarioDireccion:   z.string().optional().nullable(),
  destinatarioCiudad:      z.string().max(100).optional().nullable(),
  destinatarioDepartamento: z.string().max(100).optional().nullable(),
  destinatarioCodigoPostal: z.string().max(20).optional().nullable(),
  destinatarioPais:        z.string().length(2).optional(),
});

export type ActualizarDireccionEnvioDto = z.infer<typeof ActualizarDireccionEnvioSchema>;
