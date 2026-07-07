import { describe, it, expect } from 'vitest';
import {
  validateCodigoNotDuplicated,
  validateRegionalExists,
  validateHorario,
  validateSoftDeleteAllowed,
  validateEmailFormat,
  validateCiudadBelongsToDepartamento,
} from './business-rules.js';
import {
  SucursalCodigoDuplicadoError,
  SucursalRegionalNoEncontradaError,
  SucursalHorarioInvalidoError,
  SucursalConUsuariosActivosError,
  SucursalCiudadDepartamentoMismatchError,
} from './sucursal.errors.js';

const t = (h: number, m = 0) => new Date(2000, 0, 1, h, m, 0);

describe('Sucursal business rules', () => {

  describe('BR-SUC-001 validateCodigoNotDuplicated', () => {
    it('lanza SucursalCodigoDuplicadoError si el código ya existe', () => {
      expect(() => validateCodigoNotDuplicated('SUC-BOG-001', true))
        .toThrow(SucursalCodigoDuplicadoError);
    });

    it('no lanza error si el código es nuevo', () => {
      expect(() => validateCodigoNotDuplicated('SUC-BOG-001', false)).not.toThrow();
    });
  });

  describe('BR-SUC-002 validateRegionalExists', () => {
    it('lanza SucursalRegionalNoEncontradaError si la regional no existe', () => {
      expect(() => validateRegionalExists(99, false))
        .toThrow(SucursalRegionalNoEncontradaError);
    });

    it('no lanza error si la regional existe', () => {
      expect(() => validateRegionalExists(1, true)).not.toThrow();
    });
  });

  describe('BR-SUC-003 validateHorario', () => {
    it('lanza SucursalHorarioInvalidoError si cierre es anterior a apertura', () => {
      expect(() => validateHorario(t(17), t(8))).toThrow(SucursalHorarioInvalidoError);
    });

    it('lanza SucursalHorarioInvalidoError si cierre es igual a apertura', () => {
      expect(() => validateHorario(t(8), t(8))).toThrow(SucursalHorarioInvalidoError);
    });

    it('no lanza error si cierre es posterior a apertura', () => {
      expect(() => validateHorario(t(8), t(17))).not.toThrow();
    });

    it('no valida si apertura es null', () => {
      expect(() => validateHorario(null, t(17))).not.toThrow();
    });

    it('no valida si cierre es null', () => {
      expect(() => validateHorario(t(8), null)).not.toThrow();
    });
  });

  describe('BR-SUC-004 validateSoftDeleteAllowed', () => {
    it('lanza SucursalConUsuariosActivosError si tiene usuarios activos', () => {
      expect(() => validateSoftDeleteAllowed('1', 3))
        .toThrow(SucursalConUsuariosActivosError);
    });

    it('permite eliminar si no tiene usuarios activos', () => {
      expect(() => validateSoftDeleteAllowed('1', 0)).not.toThrow();
    });
  });

  describe('BR-SUC-005 validateEmailFormat', () => {
    it('retorna true si email es null', () => {
      expect(validateEmailFormat(null)).toBe(true);
    });

    it('retorna true para email válido', () => {
      expect(validateEmailFormat('bogota@4-72.com.co')).toBe(true);
    });

    it('retorna false para email sin @', () => {
      expect(validateEmailFormat('bogota4-72.com.co')).toBe(false);
    });

    it('retorna false para email sin dominio', () => {
      expect(validateEmailFormat('bogota@')).toBe(false);
    });
  });

  describe('BR-SUC-006 validateCiudadBelongsToDepartamento', () => {
    it('lanza SucursalCiudadDepartamentoMismatchError si la ciudad no pertenece al departamento', () => {
      expect(() => validateCiudadBelongsToDepartamento(1700, 1726))
        .toThrow(SucursalCiudadDepartamentoMismatchError);
    });

    it('no lanza error si la ciudad pertenece al departamento', () => {
      expect(() => validateCiudadBelongsToDepartamento(1726, 1726)).not.toThrow();
    });
  });
});
