import { describe, it, expect } from 'vitest';
import { calcularTotalGiroNacional } from './total-giro-nacional.js';

describe('calcularTotalGiroNacional', () => {
  it('con flete', () => {
    const r = calcularTotalGiroNacional('200000', '8000', true);
    expect(r.total).toBe('208000');
    expect(r.valorGiro).toBe('200000');
    expect(r.fleteIncluido).toBe('8000');
  });

  it('sin flete', () => {
    const r = calcularTotalGiroNacional('200000', '8000', false);
    expect(r.total).toBe('200000');
    expect(r.fleteIncluido).toBe('0');
  });

  it('valor cero con flete', () => {
    const r = calcularTotalGiroNacional('0', '5000', true);
    expect(r.total).toBe('5000');
  });

  it('flete cero incluido', () => {
    const r = calcularTotalGiroNacional('100000', '0', true);
    expect(r.total).toBe('100000');
    expect(r.fleteIncluido).toBe('0');
  });
});
