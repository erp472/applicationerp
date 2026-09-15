import { describe, it, expect } from 'vitest';
import { calcularTotalVenta } from './total-venta.js';

describe('calcularTotalVenta', () => {
  it('cálculo normal', () => {
    // 100000 - 5000 + 19000 = 114000
    expect(calcularTotalVenta('100000', '5000', '19000')).toBe('114000');
  });

  it('sin descuento sin IVA', () => {
    expect(calcularTotalVenta('50000', '0', '0')).toBe('50000');
  });

  it('redondea 0.5 hacia arriba', () => {
    expect(calcularTotalVenta('99999.5', '0', '0')).toBe('100000');
  });

  it('redondea 0.4 hacia abajo', () => {
    expect(calcularTotalVenta('99999.4', '0', '0')).toBe('99999');
  });

  it('descuento mayor que base da negativo', () => {
    expect(calcularTotalVenta('10000', '15000', '0')).toBe('-5000');
  });
});
