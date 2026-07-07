import { describe, it, expect } from 'vitest';
import {
  validateCodigoNotDuplicated,
  validatePrecio,
  calcularPrecioSinTax,
  validatePeso,
  validateFactorVolumetrico,
  isStockCritico,
  validateTipoProducto,
} from './business-rules.js';
import {
  ProductoCodigoDuplicadoError,
  ProductoPrecioInvalidoError,
  ProductoPesoInvalidoError,
  ProductoFactorVolumetricoInvalidoError,
  ProductoTipoInvalidoError,
} from './producto.errors.js';

const TIPOS_VALIDOS = ['estampilla', 'filatelia', 'empaque', 'material_oficina', 'otro'];

describe('Producto business rules', () => {

  describe('BR-PRD-001 validateCodigoNotDuplicated', () => {
    it('lanza error si el código ya existe', () => {
      expect(() => validateCodigoNotDuplicated('PRD-001', true)).toThrow(ProductoCodigoDuplicadoError);
    });
    it('no lanza error si el código es nuevo', () => {
      expect(() => validateCodigoNotDuplicated('PRD-001', false)).not.toThrow();
    });
  });

  describe('BR-PRD-002 validatePrecio', () => {
    it('lanza error si precio es 0', () => {
      expect(() => validatePrecio(0)).toThrow(ProductoPrecioInvalidoError);
    });
    it('lanza error si precio es negativo', () => {
      expect(() => validatePrecio(-500)).toThrow(ProductoPrecioInvalidoError);
    });
    it('no lanza error si precio es positivo', () => {
      expect(() => validatePrecio(1000)).not.toThrow();
    });
  });

  describe('BR-PRD-003 calcularPrecioSinTax', () => {
    it('calcula correctamente con IVA 19%: precio=11900 → 10000', () => {
      expect(calcularPrecioSinTax(11900, 19)).toBe(10000);
    });
    it('retorna el mismo precio si tax es 0%', () => {
      expect(calcularPrecioSinTax(10000, 0)).toBe(10000);
    });
    it('calcula correctamente con tax 5%: precio=10500 → 10000', () => {
      expect(calcularPrecioSinTax(10500, 5)).toBe(10000);
    });
    it('redondea a 2 decimales', () => {
      const result = calcularPrecioSinTax(1000, 19);
      expect(result).toBe(840.34);
    });
  });

  describe('BR-PRD-004 validatePeso / validateFactorVolumetrico', () => {
    it('lanza error si peso es 0', () => {
      expect(() => validatePeso(0)).toThrow(ProductoPesoInvalidoError);
    });
    it('lanza error si peso es negativo', () => {
      expect(() => validatePeso(-1)).toThrow(ProductoPesoInvalidoError);
    });
    it('no valida si peso es null', () => {
      expect(() => validatePeso(null)).not.toThrow();
    });
    it('lanza error si factor volumétrico es 0', () => {
      expect(() => validateFactorVolumetrico(0)).toThrow(ProductoFactorVolumetricoInvalidoError);
    });
    it('lanza error si factor volumétrico es negativo', () => {
      expect(() => validateFactorVolumetrico(-2500)).toThrow(ProductoFactorVolumetricoInvalidoError);
    });
  });

  describe('BR-PRD-005 isStockCritico', () => {
    it('retorna true si cantidad actual es menor que mínima', () => {
      expect(isStockCritico(3, 5)).toBe(true);
    });
    it('retorna true si cantidad actual es igual a mínima', () => {
      expect(isStockCritico(5, 5)).toBe(true);
    });
    it('retorna false si cantidad actual es mayor que mínima', () => {
      expect(isStockCritico(10, 5)).toBe(false);
    });
    it('retorna true con 0 actual y 0 mínima', () => {
      expect(isStockCritico(0, 0)).toBe(true);
    });
  });

  describe('BR-PRD-006 validateTipoProducto', () => {
    it('no lanza error para tipo válido: "estampilla"', () => {
      expect(() => validateTipoProducto('estampilla', TIPOS_VALIDOS)).not.toThrow();
    });
    it('lanza error para tipo no reconocido: "descuento"', () => {
      expect(() => validateTipoProducto('descuento', TIPOS_VALIDOS)).toThrow(ProductoTipoInvalidoError);
    });
  });
});
