import { z } from 'zod';
import { RemitenteSchema } from './crear-lote.dto.js';

export const AgregarItemMasivoSchema = z.object({
  // Remitente propio del item (requerido cuando el lote no tiene remitente global)
  remitente:             RemitenteSchema.optional(),
  destinatarioNombre:    z.string().min(1).max(300),
  destinatarioDocumento: z.string().max(30).optional(),
  destinatarioEmail:     z.string().email().max(200).optional(),
  destinatarioTelefono:  z.string().max(20).optional(),
  destinatarioDireccion: z.string().optional(),
  destinatarioCiudad:    z.string().max(100).optional(),
  destinatarioPais:      z.string().length(2).default('CO'),
  destinatarioCp:        z.string().max(20).optional(),
  pesoFisicoKg:          z.number().positive(),
  contenido:             z.string().max(200).optional(),
  observaciones:         z.string().max(500).optional(),
});

export const ActualizarItemMasivoSchema = AgregarItemMasivoSchema.partial().extend({
  destinatarioNombre: z.string().min(1).max(300).optional(),
  pesoFisicoKg:       z.number().positive().optional(),
});

export type AgregarItemMasivoDto    = z.infer<typeof AgregarItemMasivoSchema>;
export type ActualizarItemMasivoDto = z.infer<typeof ActualizarItemMasivoSchema>;
