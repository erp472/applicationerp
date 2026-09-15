import { describe, it, expect } from 'vitest';
import { calcularConversionMoneda } from './conversion-moneda.js';

describe('calcularConversionMoneda', () => {
  it('conversión normal', () => {
    const r = calcularConversionMoneda('4000000', '4000');
    expect(r.valorCop).toBe('4000000');
    expect(r.valorUsd).toBe('1000.00');
    expect(r.trmDia).toBe('4000');
  });

  it('redondeo a 2 decimales', () => {
    // 100 / 3 = 33.333... → 33.33
    const r = calcularConversionMoneda('100', '3');
    expect(r.valorUsd).toBe('33.33');
  });

  it('TRM cero lanza error', () => {
    expect(() => calcularConversionMoneda('1000', '0')).toThrow('TRM debe ser mayor a cero');
  });

  it('TRM negativa lanza error', () => {
    expect(() => calcularConversionMoneda('1000', '-100')).toThrow('TRM debe ser mayor a cero');
  });

  it('valor COP cero', () => {
    const r = calcularConversionMoneda('0', '4000');
    expect(r.valorUsd).toBe('0.00');
  });
});
