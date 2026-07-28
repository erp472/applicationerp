import { describe, it, expect } from 'vitest';
import { calcularValorRecaudo } from './valor-recaudo.js';

describe('calcularValorRecaudo', () => {
  it('con comisión', () => {
    expect(calcularValorRecaudo('50000', '2000')).toBe('52000');
  });

  it('sin comisión usa default cero', () => {
    expect(calcularValorRecaudo('75000')).toBe('75000');
  });

  it('comisión cero explícita', () => {
    expect(calcularValorRecaudo('30000', '0')).toBe('30000');
  });

  it('base cero', () => {
    expect(calcularValorRecaudo('0', '1500')).toBe('1500');
  });

  it('ambos cero', () => {
    expect(calcularValorRecaudo('0', '0')).toBe('0');
  });

  it('comisión fraccionaria', () => {
    expect(calcularValorRecaudo('100000', '1500.50')).toBe('101500.5');
  });
});
