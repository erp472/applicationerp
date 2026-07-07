import { describe, it, expect } from 'vitest';
import {
  validateCodigoNotDuplicated,
  validateNitNotDuplicated,
  validateSoftDeleteAllowed,
  validateNitFormat,
} from './business-rules.js';
import {
  ComercioCodigoDuplicadoError,
  ComercioNitDuplicadoError,
  ComercioConRegionalesActivasError,
  ComercioNitFormatoInvalidoError,
} from './comercio.errors.js';

describe('Comercio business rules', () => {

  describe('BR-COM-001 validateCodigoNotDuplicated', () => {
    it('lanza ComercioCodigoDuplicadoError si el código ya existe', () => {
      expect(() => validateCodigoNotDuplicated('4-72', true))
        .toThrow(ComercioCodigoDuplicadoError);
    });

    it('no lanza error si el código es nuevo', () => {
      expect(() => validateCodigoNotDuplicated('4-72', false)).not.toThrow();
    });
  });

  describe('BR-COM-002 validateNitNotDuplicated', () => {
    it('lanza ComercioNitDuplicadoError si el NIT ya existe', () => {
      expect(() => validateNitNotDuplicated('830113400-3', true))
        .toThrow(ComercioNitDuplicadoError);
    });

    it('no lanza error si el NIT es nuevo', () => {
      expect(() => validateNitNotDuplicated('830113400-3', false)).not.toThrow();
    });
  });

  describe('BR-COM-003 validateSoftDeleteAllowed', () => {
    it('lanza ComercioConRegionalesActivasError si tiene regionales activas', () => {
      expect(() => validateSoftDeleteAllowed('1', 2))
        .toThrow(ComercioConRegionalesActivasError);
    });

    it('permite eliminar si no tiene regionales activas', () => {
      expect(() => validateSoftDeleteAllowed('1', 0)).not.toThrow();
    });
  });

  describe('BR-COM-004 validateNitFormat', () => {
    it('acepta NIT con dígito verificador: "830113400-3"', () => {
      expect(validateNitFormat('830113400-3')).toBe(true);
    });

    it('acepta NIT sin dígito verificador: "830113400"', () => {
      expect(validateNitFormat('830113400')).toBe(true);
    });

    it('rechaza NIT con letras', () => {
      expect(() => validateNitFormat('ABC-123'))
        .toThrow(ComercioNitFormatoInvalidoError);
    });

    it('rechaza NIT vacío', () => {
      expect(() => validateNitFormat('')).toThrow(ComercioNitFormatoInvalidoError);
    });
  });
});
