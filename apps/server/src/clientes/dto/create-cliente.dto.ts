import { z } from 'zod';

export const CreateClienteSchema = z.object({
  tipoDocumento:   z.enum(['cedula', 'pasaporte', 'tarjeta_identidad', 'cedula_extranjeria', 'nit']),
  numeroDocumento: z.string().min(5).max(30),
  nombre:          z.string().min(1).max(150),
  apellido:        z.string().max(150).optional(),
  email:           z.string().email().max(200).optional(),
  telefono:        z.string().min(7).max(20).optional(),
  direccion:       z.string().max(500).optional(),
  ciudad:          z.string().max(100).optional(),
  codigoPostal:    z.string().max(20).optional(),
  tipoClienteId:   z.number().int().positive().nullable().optional(),
  nivelSisben:     z.number().int().min(1).max(4).nullable().optional(),
});

export type CreateClienteDto = z.infer<typeof CreateClienteSchema>;
