import {
  CajaYaAbiertaError,
  SesionYaCerradaError,
  SaldoInsuficienteError,
  BaseMinimaVioladaError,
  ConsignacionEstadoInvalidoError,
} from './caja.errors.js';
import type { TipoAlerta, EstadoSesionCaja, EstadoAprobacion } from './caja.entity.js';

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
