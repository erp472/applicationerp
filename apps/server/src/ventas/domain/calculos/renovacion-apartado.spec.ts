import { describe, it, expect } from 'vitest';
import { calcularRenovacionApartado } from './renovacion-apartado.js';

describe('calcularRenovacionApartado', () => {
  it('renovación normal 6 meses con IVA', () => {
    const result = calcularRenovacionApartado('2025-06-30', 6, '120000', '19', true);
    expect(result.nuevaFechaFin).toBe('2025-12-30');
    expect(result.mesesRenovacion).toBe(6);
    expect(result.precioSinTax).toBe('60000');
    expect(result.iva).toBe('11400');
    expect(result.precioTotal).toBe('71400');
  });

  it('sin IVA — precio total = sin_tax', () => {
    const result = calcularRenovacionApartado('2025-01-01', 12, '87500', '19', false);
    expect(result.nuevaFechaFin).toBe('2026-01-01');
    expect(result.iva).toBe('0');
    expect(result.precioTotal).toBe('87500');
  });

  it('un mes', () => {
    const result = calcularRenovacionApartado('2025-03-31', 1, '120000', '19', true);
    expect(result.nuevaFechaFin).toBe('2025-04-30');
    expect(result.mesesRenovacion).toBe(1);
  });

  it('meses inválidos lanza error', () => {
    expect(() => calcularRenovacionApartado('2025-01-01', 0, '120000', '19')).toThrow();
  });
});
