import { describe, it, expect } from 'vitest';
import { calcularConversionGiroInternacional } from './conversion-giro-internacional.js';

describe('calcularConversionGiroInternacional', () => {
  it('conversión normal', () => {
    const r = calcularConversionGiroInternacional('4000000', '4000');
    expect(r.valorCop).toBe('4000000');
    expect(r.valorMonedaDestino).toBe('1000.00');
    expect(r.trmDia).toBe('4000');
  });

  it('redondeo a 2 decimales', () => {
    // 100 / 3 = 33.33...
    const r = calcularConversionGiroInternacional('100', '3');
    expect(r.valorMonedaDestino).toBe('33.33');
  });

  it('TRM cero lanza error', () => {
    expect(() => calcularConversionGiroInternacional('500000', '0')).toThrow(
      'TRM debe ser mayor a cero',
    );
  });

  it('TRM negativa lanza error', () => {
    expect(() => calcularConversionGiroInternacional('500000', '-100')).toThrow(
      'TRM debe ser mayor a cero',
    );
  });

  it('valor COP cero', () => {
    const r = calcularConversionGiroInternacional('0', '4000');
    expect(r.valorMonedaDestino).toBe('0.00');
  });
});
