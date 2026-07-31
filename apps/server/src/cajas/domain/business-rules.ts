import {
  CajaYaAbiertaError,
  SesionYaCerradaError,
  SaldoInsuficienteError,
  BaseMinimaVioladaError,
  ConsignacionEstadoInvalidoError,
  MontoInvalidoError,
  CajeroYaAsignadoError,
} from './caja.errors.js';
import type { TipoAlerta, EstadoSesionCaja, EstadoAprobacion } from './caja.entity.js';

export const TIPOS_MOVIMIENTO_ENTRADA = new Set([
  'cambio_custodia_in', 'reposicion',
  'venta_producto', 'venta_servicio', 'venta_estampilla',
  'giro_emision_cobro', 'recaudo', 'diferencia_sobrante',
  'apartado_postal',
]);

// traslado_caja_fuerte: el cajero entrega físicamente a bóveda — reduce saldo del cajón
export const TIPOS_MOVIMIENTO_SALIDA = new Set([
  'cambio_custodia_out', 'giro_pago', 'consignacion',
  'diferencia_faltante', 'pago_administrativo', 'anulacion',
  'traslado_caja_fuerte',
]);

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

// BR-CAJ-004: Caja General del punto no puede caer por debajo del mínimo
export function validarCajaGeneralMinimo(
  cajaGeneral: string,
  baseMinima: string,
  montoSalida: string,
): void {
  const resultante = Number(cajaGeneral) - Number(montoSalida);
  if (resultante < Number(baseMinima)) {
    throw new BaseMinimaVioladaError(resultante.toFixed(2), baseMinima);
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
  const s = Number(saldo);
  if (s < Number(baseDia)) alertas.push('reposicion_caja');
  if (limiteAlerta && s > Number(limiteAlerta)) alertas.push('limite_efectivo_caja');
  return alertas;
}
