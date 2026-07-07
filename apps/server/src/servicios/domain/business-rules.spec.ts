import { describe, it, expect } from 'vitest';
import {
  validateCodigoNotDuplicated,
  validateRequiereDimensiones,
  calcularPesoVolumetrico,
  calcularPesoTarificado,
  validatePesoMaximo,
  validateCamposPositivos,
  validateEstampillaConsistency,
} from './business-rules.js';
import {
  ServicioCodigoDuplicadoError,
  ServicioFactorVolumetricoRequeridoError,
  ServicioPesoExcedidoError,
  ServicioCampoNegativoError,
  ServicioEstampillaInconsistenteError,
} from './servicio.errors.js';

describe('Servicio business rules', () => {

  describe('BR-SRV-001 validateCodigoNotDuplicated', () => {
    it('lanza error si el código ya existe', () => {
      expect(() => validateCodigoNotDuplicated('NAC-001', true)).toThrow(ServicioCodigoDuplicadoError);
    });
    it('no lanza error si el código es nuevo', () => {
      expect(() => validateCodigoNotDuplicated('NAC-001', false)).not.toThrow();
    });
  });

  describe('BR-SRV-002 validateRequiereDimensiones', () => {
    it('lanza error si requiere_dimensiones=true y factor es null', () => {
      expect(() => validateRequiereDimensiones(true, null)).toThrow(ServicioFactorVolumetricoRequeridoError);
    });
    it('no lanza error si requiere_dimensiones=true y factor está definido', () => {
      expect(() => validateRequiereDimensiones(true, 2500)).not.toThrow();
    });
    it('no valida si requiere_dimensiones=false', () => {
      expect(() => validateRequiereDimensiones(false, null)).not.toThrow();
    });
  });

  describe('BR-SRV-003 calcularPesoVolumetrico', () => {
    it('calcula correctamente: 30×20×10 / 2500 = 2.400 kg', () => {
      expect(calcularPesoVolumetrico(30, 20, 10, 2500)).toBe(2.4);
    });
    it('usa factor 2500 como valor estándar del servicio', () => {
      expect(calcularPesoVolumetrico(10, 10, 10, 2500)).toBe(0.4);
    });
    it('retorna 3 decimales de precisión', () => {
      const result = calcularPesoVolumetrico(10, 10, 7, 2500);
      expect(result).toBe(0.28);
    });
    it('calcula con factor personalizado 5000: 30×20×10 / 5000 = 1.200 kg', () => {
      expect(calcularPesoVolumetrico(30, 20, 10, 5000)).toBe(1.2);
    });
  });

  describe('BR-SRV-004 calcularPesoTarificado', () => {
    it('retorna el peso volumétrico cuando es mayor', () => {
      expect(calcularPesoTarificado(1.5, 2.4)).toBe(2.4);
    });
    it('retorna el peso físico cuando es mayor', () => {
      expect(calcularPesoTarificado(3.0, 2.4)).toBe(3.0);
    });
    it('retorna cualquiera cuando son iguales', () => {
      expect(calcularPesoTarificado(2.4, 2.4)).toBe(2.4);
    });
  });

  describe('BR-SRV-005 validatePesoMaximo', () => {
    it('lanza error si peso tarificado supera el máximo', () => {
      expect(() => validatePesoMaximo(5.1, 5.0)).toThrow(ServicioPesoExcedidoError);
    });
    it('no lanza error si peso tarificado es igual al máximo', () => {
      expect(() => validatePesoMaximo(5.0, 5.0)).not.toThrow();
    });
    it('no valida si peso_maximo es null (sin límite)', () => {
      expect(() => validatePesoMaximo(999, null)).not.toThrow();
    });
  });

  describe('BR-SRV-006 validateCamposPositivos', () => {
    it('lanza error si tiempo_entrega es 0', () => {
      expect(() => validateCamposPositivos(0, null)).toThrow(ServicioCampoNegativoError);
    });
    it('lanza error si tiempo_entrega es negativo', () => {
      expect(() => validateCamposPositivos(-1, null)).toThrow(ServicioCampoNegativoError);
    });
    it('lanza error si peso_maximo es 0', () => {
      expect(() => validateCamposPositivos(null, 0)).toThrow(ServicioCampoNegativoError);
    });
    it('no valida campos null', () => {
      expect(() => validateCamposPositivos(null, null)).not.toThrow();
    });
  });

  describe('BR-SRV-007 validateEstampillaConsistency', () => {
    it('no lanza error: requiere_estampilla=true y tipo=nacional', () => {
      expect(() => validateEstampillaConsistency(true, 'nacional')).not.toThrow();
    });
    it('lanza error: requiere_estampilla=true y tipo=internacional_ms', () => {
      expect(() => validateEstampillaConsistency(true, 'internacional_ms')).toThrow(ServicioEstampillaInconsistenteError);
    });
    it('no valida si requiere_estampilla=false', () => {
      expect(() => validateEstampillaConsistency(false, 'internacional_ms')).not.toThrow();
    });
  });
});
