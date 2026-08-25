import { z } from 'zod';

export const RemitenteSchema = z.object({
  nombre:       z.string().min(1).max(300),
  documento:    z.string().max(30).optional(),
  email:        z.string().email().max(200).optional(),
  telefono:     z.string().max(20).optional(),
  direccion:    z.string().optional(),
  ciudad:       z.string().max(100).optional(),
  codigoPostal: z.string().max(20).optional(),
});

export const CrearLoteMasivoSchema = z.object({
  sucursalId:    z.number().int().positive(),
  cajaId:        z.number().int().positive(),
  servicioId:    z.number().int().positive(),
  clienteId:     z.number().int().positive().optional(),
  // null cuando el modo es multi-origen (remitente por item)
  remitente:     RemitenteSchema.optional(),
  observaciones: z.string().max(500).optional(),
});

export type CrearLoteMasivoDto = z.infer<typeof CrearLoteMasivoSchema>;
