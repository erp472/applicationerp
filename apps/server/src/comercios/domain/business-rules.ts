import {
  ComercioCodigoDuplicadoError,
  ComercioNitDuplicadoError,
  ComercioConRegionalesActivasError,
  ComercioNitFormatoInvalidoError,
} from './comercio.errors.js';

// NIT colombiano: solo dígitos, con guión y dígito verificador opcional
// Válido: "830113400-3", "830113400", "9001234567"
const NIT_REGEX = /^\d{6,15}(-\d)?$/;

// BR-COM-001: código único en el sistema
export function validateCodigoNotDuplicated(codigo: string, exists: boolean): void {
  if (exists) throw new ComercioCodigoDuplicadoError(codigo);
}

// BR-COM-002: NIT único en el sistema
export function validateNitNotDuplicated(nit: string, exists: boolean): void {
  if (exists) throw new ComercioNitDuplicadoError(nit);
}

// BR-COM-003: no se puede hacer soft-delete si hay regionales activas
export function validateSoftDeleteAllowed(comercioId: string, activeRegionales: number): void {
  if (activeRegionales > 0) throw new ComercioConRegionalesActivasError(comercioId);
}

// BR-COM-004: formato NIT colombiano válido
export function validateNitFormat(nit: string): boolean {
  if (!NIT_REGEX.test(nit)) throw new ComercioNitFormatoInvalidoError(nit);
  return true;
}
