import { describe, it, expect } from 'vitest';
import { calcularFechaVencimiento } from './fecha-vencimiento.js';

describe('calcularFechaVencimiento', () => {
  it('12 meses desde enero', () => {
    expect(calcularFechaVencimiento('2025-01-01', 12)).toBe('2026-01-01');
  });

  it('1 mes desde 31 enero — clamp a 28 feb', () => {
    expect(calcularFechaVencimiento('2025-01-31', 1)).toBe('2025-02-28');
  });

  it('año bisiesto — 29 feb + 12 meses → 28 feb', () => {
    expect(calcularFechaVencimiento('2024-02-29', 12)).toBe('2025-02-28');
  });

  it('6 meses desde marzo', () => {
    expect(calcularFechaVencimiento('2025-03-15', 6)).toBe('2025-09-15');
  });

  it('cero meses lanza error', () => {
    expect(() => calcularFechaVencimiento('2025-01-01', 0)).toThrow('positivos');
  });

  it('negativo lanza error', () => {
    expect(() => calcularFechaVencimiento('2025-01-01', -3)).toThrow('positivos');
  });
});
