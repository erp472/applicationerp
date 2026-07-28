import { describe, it, expect } from 'vitest';
import { calcularReposicionCaja } from './reposicion-caja.js';

describe('calcularReposicionCaja', () => {
  it('calcula monto sin colchón', () => {
    const result = calcularReposicionCaja('50000', '200000');
    expect(result.montoRecomendado).toBe('150000.00');
    expect(result.estado).toBe('pendiente');
    expect(result.tipoMovimiento).toBe('reposicion');
  });

  it('calcula monto con colchón', () => {
    const result = calcularReposicionCaja('50000', '200000', '30000');
    expect(result.montoRecomendado).toBe('180000.00');
  });

  it('saldo mayor que base — monto 0', () => {
    const result = calcularReposicionCaja('300000', '200000');
    expect(result.montoRecomendado).toBe('0.00');
  });

  it('saldo igual a base — monto 0', () => {
    const result = calcularReposicionCaja('200000', '200000');
    expect(result.montoRecomendado).toBe('0.00');
  });

  it('preserva saldoActual y baseDia en resultado', () => {
    const result = calcularReposicionCaja('80000', '200000');
    expect(result.saldoActual).toBe('80000');
    expect(result.baseDia).toBe('200000');
  });
});
