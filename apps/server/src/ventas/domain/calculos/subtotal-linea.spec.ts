import { describe, it, expect } from 'vitest';
import { calcularSubtotalLinea } from './subtotal-linea.js';

describe('calcularSubtotalLinea', () => {
  it('sin descuento', () => {
    expect(calcularSubtotalLinea('10000', 3)).toBe('30000.00');
  });

  it('con descuento', () => {
    expect(calcularSubtotalLinea('10000', 3, '5000')).toBe('25000.00');
  });

  it('descuento exactamente igual al total', () => {
    expect(calcularSubtotalLinea('5000', 2, '10000')).toBe('0.00');
  });

  it('cantidad cero lanza error', () => {
    expect(() => calcularSubtotalLinea('5000', 0)).toThrow('mayor a cero');
  });

  it('cantidad negativa lanza error', () => {
    expect(() => calcularSubtotalLinea('5000', -1)).toThrow('mayor a cero');
  });

  it('descuento negativo lanza error', () => {
    expect(() => calcularSubtotalLinea('5000', 2, '-1000')).toThrow('negativo');
  });

  it('descuento supera total lanza error', () => {
    expect(() => calcularSubtotalLinea('5000', 1, '6000')).toThrow('supera el subtotal');
  });
});
