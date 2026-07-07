import {
  RegionalCodigoDuplicadoError,
  RegionalComercioNoEncontradoError,
  RegionalConSucursalesActivasError,
} from './regional.errors.js';

// BR-REG-001: código único global
export function validateCodigoNotDuplicated(codigo: string, exists: boolean): void {
  if (exists) throw new RegionalCodigoDuplicadoError(codigo);
}

// BR-REG-002: el comercio padre debe existir y no estar eliminado
export function validateComercioExists(comercioId: number, exists: boolean): void {
  if (!exists) throw new RegionalComercioNoEncontradoError(String(comercioId));
}

// BR-REG-003: no se puede hacer soft-delete si hay sucursales activas
export function validateSoftDeleteAllowed(regionalId: string, activeSucursales: number): void {
  if (activeSucursales > 0) throw new RegionalConSucursalesActivasError(regionalId);
}

// BR-REG-004: no se puede desactivar si hay sucursales activas
export function validateDeactivationAllowed(regionalId: string, activeSucursales: number): void {
  if (activeSucursales > 0) throw new RegionalConSucursalesActivasError(regionalId);
}
