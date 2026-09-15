import { z } from 'zod';

export const TIPOS_MOVIMIENTO_TESORERIA = ['apertura', 'ingreso', 'egreso'] as const;

export const RegistrarMovimientoSchema = z.object({
  monto: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Debe ser un valor monetario válido'),
  /** Baucher o código de aprobación del giro del comercio. Único en todo el sistema. */
  codigoAprobacion: z.string().trim().min(4).max(40),
  /** De dónde proviene el dinero y por qué se establece el giro. */
  descripcion: z.string().trim().min(10).max(500),
});

export type RegistrarMovimientoDto = z.infer<typeof RegistrarMovimientoSchema>;

export const HistorialQuerySchema = z.object({
  cajaPadreId: z.coerce.number().int().positive().optional(),
  tipo:        z.enum(TIPOS_MOVIMIENTO_TESORERIA).optional(),
  desde:       z.coerce.date().optional(),
  hasta:       z.coerce.date().optional(),
  limite:      z.coerce.number().int().positive().max(200).default(50),
  pagina:      z.coerce.number().int().min(1).default(1),
});

export type HistorialQueryDto = z.infer<typeof HistorialQuerySchema>;
