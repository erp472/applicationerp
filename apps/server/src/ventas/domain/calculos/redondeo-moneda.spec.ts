import { describe, it, expect } from 'vitest';
import { redondearMoneda } from './redondeo-moneda.js';

describe('redondearMoneda', () => {
  it('sin fracción — sin diferencia', () => {
    const result = redondearMoneda(5000);
    expect(result.montoRedondeado).toBe(5000);
    expect(result.diferencia).toBe(0);
  });

  it('redondea hacia arriba en 0.5', () => {
    const result = redondearMoneda(5000.5);
    expect(result.montoRedondeado).toBe(5001);
    expect(result.diferencia).toBeCloseTo(0.5);
  });

  it('redondea hacia abajo con fracción menor a 0.5', () => {
    const result = redondearMoneda(5000.3);
    expect(result.montoRedondeado).toBe(5000);
    expect(result.diferencia).toBeCloseTo(-0.3);
  });

  it('diferencia positiva cuando sube', () => {
    const result = redondearMoneda(999.7);
    expect(result.montoRedondeado).toBe(1000);
    expect(result.diferencia).toBeCloseTo(0.3);
  });

  it('monto cero', () => {
    const result = redondearMoneda(0);
    expect(result.montoRedondeado).toBe(0);
    expect(result.diferencia).toBe(0);
  });
});
