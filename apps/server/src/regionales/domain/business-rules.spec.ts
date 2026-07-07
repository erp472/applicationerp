import { describe, it, expect } from 'vitest';
import {
  validateCodigoNotDuplicated,
  validateComercioExists,
  validateSoftDeleteAllowed,
  validateDeactivationAllowed,
} from './business-rules.js';
import {
  RegionalCodigoDuplicadoError,
  RegionalComercioNoEncontradoError,
  RegionalConSucursalesActivasError,
} from './regional.errors.js';

describe('Regional business rules', () => {

  describe('BR-REG-001 validateCodigoNotDuplicated', () => {
    it('lanza RegionalCodigoDuplicadoError si el código ya existe', () => {
      expect(() => validateCodigoNotDuplicated('REG-BOG', true))
        .toThrow(RegionalCodigoDuplicadoError);
    });

    it('no lanza error si el código es nuevo', () => {
      expect(() => validateCodigoNotDuplicated('REG-BOG', false)).not.toThrow();
    });
  });

  describe('BR-REG-002 validateComercioExists', () => {
    it('lanza RegionalComercioNoEncontradoError si el comercio no existe', () => {
      expect(() => validateComercioExists(99, false))
        .toThrow(RegionalComercioNoEncontradoError);
    });

    it('no lanza error si el comercio existe', () => {
      expect(() => validateComercioExists(1, true)).not.toThrow();
    });
  });

  describe('BR-REG-003 validateSoftDeleteAllowed', () => {
    it('lanza RegionalConSucursalesActivasError si tiene sucursales activas', () => {
      expect(() => validateSoftDeleteAllowed('1', 3))
        .toThrow(RegionalConSucursalesActivasError);
    });

    it('permite eliminar si no tiene sucursales activas', () => {
      expect(() => validateSoftDeleteAllowed('1', 0)).not.toThrow();
    });
  });

  describe('BR-REG-004 validateDeactivationAllowed', () => {
    it('lanza RegionalConSucursalesActivasError al desactivar con sucursales activas', () => {
      expect(() => validateDeactivationAllowed('1', 2))
        .toThrow(RegionalConSucursalesActivasError);
    });

    it('permite desactivar si no hay sucursales activas', () => {
      expect(() => validateDeactivationAllowed('1', 0)).not.toThrow();
    });
  });
});
