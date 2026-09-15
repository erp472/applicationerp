import { describe, it, expect } from 'vitest';
import { calcularTotalGiroInternacional } from './total-giro-internacional.js';

describe('calcularTotalGiroInternacional', () => {
  it('resultado normal', () => {
    // 500000 + 15000 = 515000; 500000/4000 = 125.00
    const r = calcularTotalGiroInternacional('500000', '15000', '4000');
    expect(r.totalCop).toBe('515000');
    expect(r.pagaCop).toBe('515000');
    expect(r.llegaMonedaDestino).toBe('125.00');
    expect(r.trmDia).toBe('4000');
  });

  it('comisión cero', () => {
    // 200000 + 0; 200000/4000 = 50.00
    const r = calcularTotalGiroInternacional('200000', '0', '4000');
    expect(r.totalCop).toBe('200000');
    expect(r.llegaMonedaDestino).toBe('50.00');
  });

  it('redondeo llega destino', () => {
    // 100000 / 3000 = 33.33...
    const r = calcularTotalGiroInternacional('100000', '5000', '3000');
    expect(r.llegaMonedaDestino).toBe('33.33');
  });
});
