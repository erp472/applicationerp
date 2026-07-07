import {
  EquipoMacFormatoInvalidoError,
  EquipoMacDuplicadoError,
  EquipoSucursalNoEncontradaError,
  EquipoInactivoError,
} from './equipo.errors.js';

// Patrón MAC: 6 grupos de 2 dígitos hex separados por ':'
const MAC_REGEX = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

// BR-EQP-001: formato MAC address válido
export function validateMacFormat(mac: string): void {
  if (!MAC_REGEX.test(mac)) throw new EquipoMacFormatoInvalidoError(mac);
}

// BR-EQP-002: MAC único globalmente (incluyendo soft-deleted — no se reutilizan)
export function validateMacNotDuplicated(mac: string, exists: boolean): void {
  if (exists) throw new EquipoMacDuplicadoError(mac);
}

// BR-EQP-003: la sucursal referenciada debe existir
export function validateSucursalExists(sucursalId: number, exists: boolean): void {
  if (!exists) throw new EquipoSucursalNoEncontradaError(String(sucursalId));
}

// BR-EQP-004: normalizar MAC a uppercase antes de persistir
export function normalizeMac(mac: string): string {
  return mac.toUpperCase();
}

// BR-EQP-005: solo equipos activos pueden autenticar (#POC-AUTH-001)
export function validateEquipoActivo(mac: string, activo: boolean): void {
  if (!activo) throw new EquipoInactivoError(mac);
}
