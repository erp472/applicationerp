import { z } from 'zod';

const PersonaEnvioSchema = z.object({
  nombre:         z.string().min(1).max(300),
  empresa:        z.string().max(300).optional(),
  documento:      z.string().max(30).optional(),
  tipoDocumento:  z.string().max(10).optional(),
  email:          z.string().email().max(200).optional(),
  telefono:       z.string().max(20).optional(),
  direccion:      z.string().optional(),
  ciudad:         z.string().max(100).optional(),
  departamento:   z.string().max(100).optional(),
  pais:           z.string().length(2).default('CO'),
  codigoPostal:   z.string().max(20).optional(),
});

export const CrearEnvioSchema = z.object({
  servicioId:       z.number().int().positive(),
  sucursalId:       z.number().int().positive(),
  remitente:        PersonaEnvioSchema,
  destinatario:     PersonaEnvioSchema,
  pesoFisicoKg:     z.number().positive(),
  cantidadPiezas:   z.number().int().positive().default(1),
  altoCm:           z.number().positive().optional(),
  anchoCm:          z.number().positive().optional(),
  largoCm:          z.number().positive().optional(),
  valorDeclarado:   z.number().nonnegative().optional(),
  seguroAdicional:  z.boolean().default(false),
  asignarCaja:      z.boolean().default(false),
  contenido:        z.string().max(200).optional(),
  observaciones:    z.string().max(500).optional(),
  medioPago:        z.enum(['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'consignacion', 'preporteado', 'mixto_preporteado']),
  // preporteado / mixto_preporteado breakdown (required when medioPago uses estampillas)
  montoEstampillas: z.number().positive().optional(),
  montoEfectivo:    z.number().positive().optional(),
  // international CP guide (format: LLddddddddLL)
  guiaCp:           z.string().regex(/^[A-Z]{2}\d{8}[A-Z]{2}$/, 'Formato esperado: LLddddddddLL').optional(),
  esCorrespondencia: z.boolean().optional(),
  // Para servicios nacionales: tipo de trayecto que determina la tarifa aplicable
  tipoTrayecto: z.enum(['NACIONAL', 'URBANO', 'ESPECIAL']).optional(),
  // Cliente identificado de la venta (cuando se crea un envío fuera del carrito pero con cliente conocido)
  clienteId: z.number().int().positive().optional(),
});

export type CrearEnvioDto = z.infer<typeof CrearEnvioSchema>;
