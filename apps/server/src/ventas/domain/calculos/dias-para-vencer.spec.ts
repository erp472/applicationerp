import { describe, it, expect } from 'vitest';
import { calcularDiasParaVencer } from './dias-para-vencer.js';

describe('calcularDiasParaVencer', () => {
  it('dias positivos', () => {
    expect(calcularDiasParaVencer('2025-12-31', '2025-12-01')).toBe(30);
  });

  it('hoy es el día de vencimiento', () => {
    expect(calcularDiasParaVencer('2025-06-15', '2025-06-15')).toBe(0);
  });

  it('ya venció — retorna negativo', () => {
    expect(calcularDiasParaVencer('2025-01-01', '2025-06-01')).toBeLessThan(0);
  });

  it('exactamente un día', () => {
    expect(calcularDiasParaVencer('2025-07-02', '2025-07-01')).toBe(1);
  });
});
