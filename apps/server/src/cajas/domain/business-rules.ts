import {
  CajaYaAbiertaError,
  SesionYaCerradaError,
  SaldoInsuficienteError,
  AperturaExcedeAsignacionPuntoError,
  BaseExcedeLimiteCajaError,
  ConsignacionEstadoInvalidoError,
  MontoInvalidoError,
  CajeroYaAsignadoError,
} from './caja.errors.js';
import type { TipoAlerta, EstadoSesionCaja, EstadoAprobacion } from './caja.entity.js';
import { evaluarAlertaReposicion } from './calculos/alerta-reposicion.js';
import { evaluarLimiteEfectivo } from './calculos/limite-efectivo-alerta.js';

export const TIPOS_MOVIMIENTO_ENTRADA = new Set([
  'cambio_custodia_in', 'reposicion',
  'venta_producto', 'venta_servicio', 'venta_estampilla',
  'giro_emision_cobro', 'recaudo', 'diferencia_sobrante',
  'apartado_postal',
]);

// Lo que el comercio le cobró al público. Deja fuera cambio_custodia_in, reposicion
// y diferencia_sobrante: esos son plata que ya estaba en la caja fuerte moviéndose
// hacia el cajón, y sumarlos como recaudo contaba el mismo dinero en cada traslado.
export const TIPOS_RECAUDO = new Set([
  'venta_producto', 'venta_servicio', 'venta_estampilla',
  'giro_emision_cobro', 'recaudo', 'apartado_postal',
]);

// Cómo se le presenta el movimiento a supervisión en el histórico. Los tipos que no
// aparecen aquí son plata moviéndose dentro del propio comercio (custodia, reposición,
// traslado, consignación): no son operaciones contra el público y tienen su propia vista.
export const CATEGORIAS_HISTORICO = {
  recaudos:    ['recaudo'],
  facturacion: ['venta_producto', 'venta_servicio', 'venta_estampilla', 'giro_emision_cobro', 'apartado_postal'],
  anulaciones: ['anulacion'],
  ajustes:     ['diferencia_sobrante', 'diferencia_faltante'],
} as const;

export type CategoriaHistorico = keyof typeof CATEGORIAS_HISTORICO;

export function categoriaDeMovimiento(tipo: string): CategoriaHistorico | null {
  for (const [categoria, tipos] of Object.entries(CATEGORIAS_HISTORICO)) {
    if ((tipos as readonly string[]).includes(tipo)) return categoria as CategoriaHistorico;
  }
  return null;
}

// traslado_caja_fuerte: el cajero entrega físicamente a bóveda — reduce saldo del cajón
export const TIPOS_MOVIMIENTO_SALIDA = new Set([
  'cambio_custodia_out', 'giro_pago', 'consignacion',
  'diferencia_faltante', 'pago_administrativo', 'anulacion',
  'traslado_caja_fuerte',
]);

// El saldo de una sesión es el efectivo del cajón, no la facturación. Un pago con
// tarjeta/transferencia/preporteado se registra como venta pero nunca entra al cajón:
// contarlo hacía que el arqueo siempre diera faltante y que el cierre arrastrara ese
// exceso a la caja principal vía cambio_custodia.
export const MEDIOS_SIN_EFECTIVO = new Set([
  'tarjeta_debito', 'tarjeta_credito', 'transferencia',
  'consignacion', 'cheque', 'preporteado', 'mixto_preporteado', 'estampilla',
]);

export const MEDIOS_TARJETA = new Set(['tarjeta_debito', 'tarjeta_credito']);

export function esTarjeta(medioPago?: string | null): boolean {
  return !!medioPago && MEDIOS_TARJETA.has(medioPago);
}

// Sin medio de pago = movimiento interno de caja (apertura, custodia, reposición,
// traslado, diferencia): siempre es efectivo físico.
export function afectaEfectivo(medioPago?: string | null): boolean {
  return !medioPago || !MEDIOS_SIN_EFECTIVO.has(medioPago);
}

export function deltaEfectivo(tipo: string, monto: number, medioPago?: string | null): number {
  if (!afectaEfectivo(medioPago)) return 0;
  if (TIPOS_MOVIMIENTO_ENTRADA.has(tipo)) return monto;
  if (TIPOS_MOVIMIENTO_SALIDA.has(tipo)) return -monto;
  return 0;
}

// BR-CAJ-001
export function validarUnicidadSesion(cajaId: number, sesionAbierta: boolean): void {
  if (sesionAbierta) throw new CajaYaAbiertaError(cajaId);
}

// BR-CAJ-002
export function validarSesionAbierta(sesionId: number, estado: EstadoSesionCaja): void {
  if (estado !== 'abierta') throw new SesionYaCerradaError(sesionId);
}

// BR-CAJ-003
export function validarSaldoSuficiente(saldo: string, monto: string): void {
  if (Number(saldo) < Number(monto)) throw new SaldoInsuficienteError(saldo, monto);
}

// BR-CAJ-010: la Caja Fuerte del punto no puede abrir con más efectivo del que la
// Caja General le asignó (cajas_padres.base_general). Sin este tope el punto abría
// con el global de la Caja General y lo mostraba como saldo propio.
// No es un piso: el efectivo que baja a las auxiliares sigue dentro del punto, así
// que la bóveda sí puede quedar por debajo de la base durante el turno.
export function validarAperturaPunto(
  montoApertura: string,
  baseGeneral: string,
  nombrePunto: string,
): void {
  if (Number(montoApertura) > Number(baseGeneral)) {
    throw new AperturaExcedeAsignacionPuntoError(montoApertura, baseGeneral, nombrePunto);
  }
}

// BR-CAJ-009: la base que recibe una caja auxiliar no puede exceder su fondo
// configurado. La Caja Fuerte es la reserva del punto, no un saldo disponible para
// una sola caja: sin este tope se podía asignar la bóveda entera a un POS.
export function validarBaseAsignadaMaxima(
  baseAsignada: string,
  baseDia: string,
  codigoCaja: string,
): void {
  if (Number(baseAsignada) > Number(baseDia)) {
    throw new BaseExcedeLimiteCajaError(baseAsignada, baseDia, codigoCaja);
  }
}

// BR-CAJ-005: La consignación solo se puede aprobar/rechazar si está pendiente
export function validarConsignacionPendiente(id: number, estado: EstadoAprobacion): void {
  if (estado !== 'pendiente') throw new ConsignacionEstadoInvalidoError(estado);
}

// BR-CAJ-007: monto de apertura o base asignada debe ser mayor a cero
export function validarMontoPositivo(monto: string, label: string): void {
  if (Number(monto) <= 0) throw new MontoInvalidoError(label);
}

// Calcula el total del arqueo físico a partir del desglose de denominaciones (server-side)
// Evita confiar en el totalArqueo declarado por el cliente
export function computarArqueo(denominaciones: Array<{ denominacion: number; cantidad: number }> | undefined): number | null {
  if (!denominaciones || denominaciones.length === 0) return null;
  return denominaciones.reduce((sum, d) => sum + d.denominacion * d.cantidad, 0);
}

// BR-CAJ-008: un cajero solo puede ser custodio responsable de una caja auxiliar abierta a la vez
export function validarUnicidadCustodio(cajeroId: number, tieneSesionAbierta: boolean): void {
  if (tieneSesionAbierta) throw new CajeroYaAsignadoError(cajeroId);
}

// BR-CAJ-006: evalúa alertas después de registrar un movimiento
export function evaluarAlertas(
  saldo: string,
  baseDia: string,
  limiteAlerta: string | null,
): TipoAlerta[] {
  const alertas: TipoAlerta[] = [];
  if (evaluarAlertaReposicion(saldo, baseDia).necesitaReposicion) alertas.push('reposicion_caja');
  if (limiteAlerta && evaluarLimiteEfectivo(saldo, limiteAlerta).superaLimite) alertas.push('limite_efectivo_caja');
  return alertas;
}
