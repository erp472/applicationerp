import { z } from 'zod';

export const TipoProductoEnum = z.enum(['estampilla', 'filatelia', 'empaque', 'material_oficina', 'otro']);

export const CreateProductoSchema = z.object({
  codigo:             z.string().min(1).max(50),
  nombre:             z.string().min(1).max(200),
  descripcion:        z.string().nullable().optional(),
  serie:              z.string().max(100).nullable().optional(),
  tipo:               TipoProductoEnum,
  precio:             z.number().positive(),
  porcentaje_tax:     z.number().min(0).max(100).default(0),
  peso:               z.number().positive().nullable().optional(),
  factor_volumetrico: z.number().positive().nullable().optional(),
  imagen_url:         z.string().url().nullable().optional(),
});

export type CreateProductoDto = z.infer<typeof CreateProductoSchema>;
