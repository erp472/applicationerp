import { describe, it, expect } from 'vitest';
import { calcularSubtotalServicioEspecial } from './subtotal-servicio-especial.js';

describe('calcularSubtotalServicioEspecial', () => {
  it('sin descuento', () => {
    expect(calcularSubtotalServicioEspecial('15000', 4)).toBe('60000.00');
  });

  it('con descuento', () => {
    expect(calcularSubtotalServicioEspecial('10000', 2, '5000')).toBe('15000.00');
  });

  it('descuento exactamente igual al total', () => {
    expect(calcularSubtotalServicioEspecial('5000', 1, '5000')).toBe('0.00');
  });

  it('cantidad cero lanza error', () => {
    expect(() => calcularSubtotalServicioEspecial('5000', 0)).toThrow('mayor a cero');
  });

  it('cantidad negativa lanza error', () => {
    expect(() => calcularSubtotalServicioEspecial('5000', -2)).toThrow('mayor a cero');
  });

  it('descuento supera el valor lanza error', () => {
    expect(() => calcularSubtotalServicioEspecial('5000', 1, '6000')).toThrow('supera el valor');
  });
});
