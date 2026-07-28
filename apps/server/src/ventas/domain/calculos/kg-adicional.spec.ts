import { describe, it, expect } from 'vitest';
import { calcularKgAdicional } from './kg-adicional.js';

describe('calcularKgAdicional', () => {
  it('peso igual al techo — sin exceso', () => {
    expect(calcularKgAdicional(5, 5, '2000')).toBe('0');
  });

  it('exceso de 2 kg', () => {
    // (7 - 5) * 2000 = 4000
    expect(calcularKgAdicional(7, 5, '2000')).toBe('4000');
  });

  it('peso menor al techo — sin exceso', () => {
    expect(calcularKgAdicional(3, 5, '2000')).toBe('0');
  });

  it('tarifa cero siempre da cero', () => {
    expect(calcularKgAdicional(10, 5, '0')).toBe('0');
  });

  it('fracción de kg', () => {
    // (5.5 - 5) * 1000 = 500
    expect(calcularKgAdicional(5.5, 5, '1000')).toBe('500');
  });
});
