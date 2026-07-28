import { describe, it, expect } from 'vitest';
import { calcularValorServicioTotal } from './valor-servicio-total.js';

describe('calcularValorServicioTotal', () => {
  it('suma básica', () => {
    expect(calcularValorServicioTotal('15000', '4000')).toBe('19000');
  });

  it('sin adicional', () => {
    expect(calcularValorServicioTotal('15000', '0')).toBe('15000');
  });

  it('redondeo al entero más cercano', () => {
    // 10000.4 + 500.1 = 10500.5 → 10501
    expect(calcularValorServicioTotal('10000.4', '500.1')).toBe('10501');
  });

  it('fracción redondea arriba', () => {
    // 100.5 + 0 = 100.5 → 101
    expect(calcularValorServicioTotal('100.5', '0')).toBe('101');
  });
});
