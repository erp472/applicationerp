/**
 * Operaciones que el supervisor habilita o inhabilita por caja.
 * No confundir con `servicios` / `servicios_sucursal`, que son el catálogo de
 * servicios postales de envío (NP-DOC-NOR, P-PAQ-CERT…).
 */
export const SERVICIOS_CAJA = {
  giro_nacional_emision:      'Emisión Giros Nacionales',
  giro_nacional_pago:         'Pago Giros Nacionales',
  giro_nacional_anulacion:    'Anulación Giro Nacional',
  giro_internacional_emision: 'Emisión Giros Internacionales',
  giro_internacional_pago:    'Pago Giros Internacionales',
  estampillas:                'Estampillas',
  empaques:                   'Venta de Empaques',
  certificaciones:            'Certificaciones',
  apartado_postal:            'Apartado Postal',
  recaudo_facturas:           'Recaudo de Facturas',
} as const;

export type ServicioCajaCodigo = keyof typeof SERVICIOS_CAJA;

export const CODIGOS_SERVICIO_CAJA = Object.keys(SERVICIOS_CAJA) as ServicioCajaCodigo[];

export function esServicioCajaValido(codigo: string): codigo is ServicioCajaCodigo {
  return codigo in SERVICIOS_CAJA;
}

export interface ServicioCajaItem {
  codigo: ServicioCajaCodigo;
  nombre: string;
  activo: boolean;
}

/**
 * Sin fila en `servicios_caja` el servicio se considera activo: así las cajas
 * existentes conservan su comportamiento y solo se persiste lo que el
 * supervisor cambia explícitamente.
 */
export function construirServiciosCaja(overrides: Map<string, boolean>): ServicioCajaItem[] {
  return CODIGOS_SERVICIO_CAJA.map(codigo => ({
    codigo,
    nombre: SERVICIOS_CAJA[codigo],
    activo: overrides.get(codigo) ?? true,
  }));
}
