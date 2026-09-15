import { describe, it, expect } from 'vitest';
import { calcularRetencionFuente } from './retencion-fuente.js';

describe('calcularRetencionFuente', () => {
  it('corporativo aplica retención', () => {
    // 100000 × 3.5% = 3500
    expect(calcularRetencionFuente('100000', '3.5', 'corporativo', '150000', '100000')).toBe('3500');
  });

  it('expendio aplica retención', () => {
    // 200000 × 2% = 4000
    expect(calcularRetencionFuente('200000', '2', 'expendio', '200000', '100000')).toBe('4000');
  });

  it('persona natural no aplica', () => {
    expect(calcularRetencionFuente('200000', '3.5', 'natural', '200000', '100000')).toBe('0');
  });

  it('total menor al tope no aplica', () => {
    expect(calcularRetencionFuente('50000', '3.5', 'corporativo', '80000', '100000')).toBe('0');
  });

  it('exactamente en el tope aplica', () => {
    expect(calcularRetencionFuente('100000', '3.5', 'corporativo', '100000', '100000')).toBe('3500');
  });

  it('redondeo medio peso', () => {
    // 100001 × 3.5 / 100 = 3500.035 → 3500
    expect(calcularRetencionFuente('100001', '3.5', 'corporativo', '100001', '100000')).toBe('3500');
  });
});
