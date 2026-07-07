import { describe, it, expect } from 'vitest';
import {
  validateMacFormat,
  validateMacNotDuplicated,
  validateSucursalExists,
  normalizeMac,
  validateEquipoActivo,
} from './business-rules.js';
import {
  EquipoMacFormatoInvalidoError,
  EquipoMacDuplicadoError,
  EquipoSucursalNoEncontradaError,
  EquipoInactivoError,
} from './equipo.errors.js';

describe('Equipo business rules', () => {

  describe('BR-EQP-001 validateMacFormat', () => {
    it('acepta MAC válido con mayúsculas: "AA:BB:CC:DD:EE:FF"', () => {
      expect(() => validateMacFormat('AA:BB:CC:DD:EE:FF')).not.toThrow();
    });

    it('acepta MAC válido con minúsculas: "aa:bb:cc:dd:ee:ff"', () => {
      expect(() => validateMacFormat('aa:bb:cc:dd:ee:ff')).not.toThrow();
    });

    it('acepta MAC válido mixto: "aA:Bb:cC:dD:eE:fF"', () => {
      expect(() => validateMacFormat('aA:Bb:cC:dD:eE:fF')).not.toThrow();
    });

    it('lanza error con separador guión: "AA-BB-CC-DD-EE-FF"', () => {
      expect(() => validateMacFormat('AA-BB-CC-DD-EE-FF'))
        .toThrow(EquipoMacFormatoInvalidoError);
    });

    it('lanza error con MAC de 5 segmentos', () => {
      expect(() => validateMacFormat('AA:BB:CC:DD:EE'))
        .toThrow(EquipoMacFormatoInvalidoError);
    });

    it('lanza error con caracteres no hexadecimales', () => {
      expect(() => validateMacFormat('GG:BB:CC:DD:EE:FF'))
        .toThrow(EquipoMacFormatoInvalidoError);
    });

    it('lanza error con MAC vacío', () => {
      expect(() => validateMacFormat('')).toThrow(EquipoMacFormatoInvalidoError);
    });
  });

  describe('BR-EQP-002 validateMacNotDuplicated', () => {
    it('lanza EquipoMacDuplicadoError si MAC ya existe', () => {
      expect(() => validateMacNotDuplicated('AA:BB:CC:DD:EE:FF', true))
        .toThrow(EquipoMacDuplicadoError);
    });

    it('no lanza error si MAC es nuevo', () => {
      expect(() => validateMacNotDuplicated('AA:BB:CC:DD:EE:FF', false)).not.toThrow();
    });
  });

  describe('BR-EQP-003 validateSucursalExists', () => {
    it('lanza EquipoSucursalNoEncontradaError si la sucursal no existe', () => {
      expect(() => validateSucursalExists(99, false))
        .toThrow(EquipoSucursalNoEncontradaError);
    });

    it('no lanza error si la sucursal existe', () => {
      expect(() => validateSucursalExists(1, true)).not.toThrow();
    });
  });

  describe('BR-EQP-004 normalizeMac', () => {
    it('convierte minúsculas a mayúsculas', () => {
      expect(normalizeMac('aa:bb:cc:dd:ee:ff')).toBe('AA:BB:CC:DD:EE:FF');
    });

    it('no modifica MAC ya en mayúsculas', () => {
      expect(normalizeMac('AA:BB:CC:DD:EE:FF')).toBe('AA:BB:CC:DD:EE:FF');
    });

    it('normaliza MAC mixto correctamente', () => {
      expect(normalizeMac('aA:Bb:cC:dD:eE:fF')).toBe('AA:BB:CC:DD:EE:FF');
    });
  });

  describe('BR-EQP-005 validateEquipoActivo', () => {
    it('lanza EquipoInactivoError si el equipo está inactivo', () => {
      expect(() => validateEquipoActivo('AA:BB:CC:DD:EE:FF', false))
        .toThrow(EquipoInactivoError);
    });

    it('no lanza error si el equipo está activo', () => {
      expect(() => validateEquipoActivo('AA:BB:CC:DD:EE:FF', true)).not.toThrow();
    });
  });
});
