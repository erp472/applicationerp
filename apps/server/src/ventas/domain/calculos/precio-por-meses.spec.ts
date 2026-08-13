import { describe, it, expect } from 'vitest';
import { calcularPrecioPorMeses } from './precio-por-meses.js';

describe('calcularPrecioPorMeses', () => {
  it('año completo = tarifa anual', () => {
    expect(calcularPrecioPorMeses('120000', 12)).toBe('120000');
  });

  it('seis meses = mitad', () => {
    expect(calcularPrecioPorMeses('120000', 6)).toBe('60000');
  });

  it('un mes — redondea correctamente', () => {
    // 87500 / 12 = 7291.666... → 7292
    expect(calcularPrecioPorMeses('87500', 1)).toBe('7292');
  });

  it('tres meses', () => {
    expect(calcularPrecioPorMeses('120000', 3)).toBe('30000');
  });

  it('24 meses (2 años)', () => {
    expect(calcularPrecioPorMeses('120000', 24)).toBe('240000');
  });

  it('36 meses (máximo permitido)', () => {
    expect(calcularPrecioPorMeses('87500', 36)).toBe('262500');
  });

  it('cero meses lanza error', () => {
    expect(() => calcularPrecioPorMeses('120000', 0)).toThrow('entre 1 y 36');
  });

  it('negativo lanza error', () => {
    expect(() => calcularPrecioPorMeses('120000', -1)).toThrow('entre 1 y 36');
  });

  it('más de 36 meses lanza error', () => {
    expect(() => calcularPrecioPorMeses('120000', 37)).toThrow('entre 1 y 36');
  });
});
