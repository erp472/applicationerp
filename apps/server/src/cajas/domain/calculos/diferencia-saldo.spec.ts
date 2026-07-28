import { describe, it, expect } from 'vitest';
import {
  calcularDiferenciaFaltante,
  calcularDiferenciaSobrante,
  calcularImpactoDiferenciaAprobada,
} from './diferencia-saldo.js';

describe('calcularDiferenciaFaltante', () => {
  it('caso normal', () => {
    const result = calcularDiferenciaFaltante('500000', '480000');
    expect(result.faltante).toBe('20000.00');
    expect(result.tipoMovimiento).toBe('diferencia_faltante');
    expect(result.estado).toBe('pendiente');
    expect(result.esEntrada).toBe(false);
  });

  it('diferencia pequeña', () => {
    const result = calcularDiferenciaFaltante('100', '99');
    expect(result.faltante).toBe('1.00');
  });

  it('iguales lanza error', () => {
    expect(() => calcularDiferenciaFaltante('500000', '500000')).toThrow('No hay faltante');
  });

  it('físico mayor lanza error', () => {
    expect(() => calcularDiferenciaFaltante('400000', '500000')).toThrow('No hay faltante');
  });
});

describe('calcularDiferenciaSobrante', () => {
  it('caso normal', () => {
    const result = calcularDiferenciaSobrante('480000', '500000');
    expect(result.sobrante).toBe('20000.00');
    expect(result.tipoMovimiento).toBe('diferencia_sobrante');
    expect(result.estado).toBe('pendiente');
    expect(result.esEntrada).toBe(true);
  });

  it('diferencia pequeña', () => {
    const result = calcularDiferenciaSobrante('99', '100');
    expect(result.sobrante).toBe('1.00');
  });

  it('iguales lanza error', () => {
    expect(() => calcularDiferenciaSobrante('500000', '500000')).toThrow('No hay sobrante');
  });

  it('sistema mayor lanza error', () => {
    expect(() => calcularDiferenciaSobrante('600000', '500000')).toThrow('No hay sobrante');
  });
});

describe('calcularImpactoDiferenciaAprobada', () => {
  it('sobrante suma al saldo', () => {
    const result = calcularImpactoDiferenciaAprobada('20000', 'sobrante', '480000');
    expect(result.saldoAjustado).toBe('500000.00');
    expect(result.esEntrada).toBe(true);
    expect(result.estado).toBe('aprobada');
    expect(result.tipo).toBe('sobrante');
  });

  it('faltante resta al saldo', () => {
    const result = calcularImpactoDiferenciaAprobada('20000', 'faltante', '500000');
    expect(result.saldoAjustado).toBe('480000.00');
    expect(result.esEntrada).toBe(false);
    expect(result.estado).toBe('aprobada');
    expect(result.tipo).toBe('faltante');
  });

  it('preserva monto en resultado', () => {
    const result = calcularImpactoDiferenciaAprobada('5000', 'sobrante', '100000');
    expect(result.monto).toBe('5000');
  });

  it('tipo inválido lanza error', () => {
    expect(() =>
      calcularImpactoDiferenciaAprobada('1000', 'desconocido' as any, '100000'),
    ).toThrow('inválido');
  });
});
