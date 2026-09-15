import { z } from 'zod';

export const TipoServicioEnum = z.enum(['nacional', 'internacional_ms', 'internacional_courier', 'apartado_postal', 'alistamiento']);

export const CreateServicioSchema = z.object({
  codigo:                  z.string().min(1).max(50),
  nombre:                  z.string().min(1).max(200),
  descripcion:             z.string().nullable().optional(),
  tipo:                    TipoServicioEnum,
  requiere_estampilla:     z.boolean().default(false),
  requiere_dimensiones:    z.boolean().default(false),
  requiere_valor_declarado: z.boolean().default(false),
  peso_maximo_kg:          z.number().positive().nullable().optional(),
  factor_volumetrico:      z.number().int().positive().default(2500),
  tiempo_entrega_dias:     z.number().int().positive().nullable().optional(),
  codigo_sigma:            z.string().max(50).nullable().optional(),
  minimo_seguro_postal:    z.number().min(0).nullable().optional(),
  alto_max_cm:             z.number().positive().nullable().optional(),
  ancho_max_cm:            z.number().positive().nullable().optional(),
  largo_max_cm:            z.number().positive().nullable().optional(),
});

export type CreateServicioDto = z.infer<typeof CreateServicioSchema>;
