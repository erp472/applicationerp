import { z } from 'zod';

export const UpdateServicioSchema = z.object({
  nombre:                  z.string().min(1).max(200).optional(),
  descripcion:             z.string().nullable().optional(),
  requiere_estampilla:     z.boolean().optional(),
  requiere_dimensiones:    z.boolean().optional(),
  requiere_valor_declarado: z.boolean().optional(),
  peso_maximo_kg:          z.number().positive().nullable().optional(),
  factor_volumetrico:      z.number().int().positive().optional(),
  tiempo_entrega_dias:     z.number().int().positive().nullable().optional(),
  codigo_sigma:            z.string().max(50).nullable().optional(),
  minimo_seguro_postal:    z.number().min(0).nullable().optional(),
  alto_max_cm:             z.number().positive().nullable().optional(),
  ancho_max_cm:            z.number().positive().nullable().optional(),
  largo_max_cm:            z.number().positive().nullable().optional(),
  activo:                  z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Debe enviar al menos un campo' });

export type UpdateServicioDto = z.infer<typeof UpdateServicioSchema>;
