import {
  SucursalCodigoDuplicadoError,
  SucursalRegionalNoEncontradaError,
  SucursalHorarioInvalidoError,
  SucursalConUsuariosActivosError,
  SucursalCiudadDepartamentoMismatchError,
} from './sucursal.errors.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// BR-SUC-001: código único global
export function validateCodigoNotDuplicated(codigo: string, exists: boolean): void {
  if (exists) throw new SucursalCodigoDuplicadoError(codigo);
}

// BR-SUC-002: la regional padre debe existir y no estar eliminada
export function validateRegionalExists(regionalId: number, exists: boolean): void {
  if (!exists) throw new SucursalRegionalNoEncontradaError(String(regionalId));
}

// BR-SUC-003: horario de cierre debe ser posterior al de apertura
export function validateHorario(apertura: Date | null, cierre: Date | null): void {
  if (apertura === null || cierre === null) return;
  // compara solo la parte de tiempo (horas/minutos/segundos)
  const ap = apertura.getHours() * 3600 + apertura.getMinutes() * 60 + apertura.getSeconds();
  const ci = cierre.getHours()   * 3600 + cierre.getMinutes()   * 60 + cierre.getSeconds();
  if (ci <= ap) throw new SucursalHorarioInvalidoError();
}

// BR-SUC-004: no se puede hacer soft-delete si hay usuarios activos asignados
export function validateSoftDeleteAllowed(sucursalId: string, activeUsers: number): void {
  if (activeUsers > 0) throw new SucursalConUsuariosActivosError(sucursalId);
}

// BR-SUC-005: email válido si se provee (retorna boolean, no lanza)
export function validateEmailFormat(email: string | null): boolean {
  if (email === null || email === undefined) return true;
  return EMAIL_REGEX.test(email);
}

// BR-SUC-006: la ciudad debe pertenecer al departamento indicado
export function validateCiudadBelongsToDepartamento(
  ciudadDepartamentoId: number,
  departamentoId: number,
): void {
  if (ciudadDepartamentoId !== departamentoId) {
    throw new SucursalCiudadDepartamentoMismatchError(
      String(ciudadDepartamentoId),
      String(departamentoId),
    );
  }
}
