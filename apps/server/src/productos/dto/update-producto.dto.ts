import { z } from 'zod';

export const UpdateProductoSchema = z.object({
  nombre:             z.string().min(1).max(200).optional(),
  descripcion:        z.string().nullable().optional(),
  serie:              z.string().max(100).nullable().optional(),
  precio:             z.number().positive().optional(),
  porcentaje_tax:     z.number().min(0).max(100).optional(),
  peso:               z.number().positive().nullable().optional(),
  factor_volumetrico: z.number().positive().nullable().optional(),
  imagen_url:         z.string().url().nullable().optional(),
  activo:             z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Debe enviar al menos un campo' });

export type UpdateProductoDto = z.infer<typeof UpdateProductoSchema>;
