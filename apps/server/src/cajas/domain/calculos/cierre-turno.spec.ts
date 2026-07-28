import { describe, it, expect } from 'vitest';
import { calcularCierreTurno, calcularDiferenciaCierre } from './cierre-turno.js';

describe('calcularCierreTurno', () => {
  it('cuadre perfecto — diferencia 0', () => {
    const result = calcularCierreTurno('250000', [
      { denominacion: 50000, cantidad: 4 },
      { denominacion: 10000, cantidad: 5 },
    ]);
    expect(result.saldoEsperado).toBe('250000');
    expect(result.totalArqueo).toBe('250000.00');
    expect(result.diferencia).toBe('0.00');
    expect(result.tieneDiferencia).toBe(false);
    expect(result.tipoMovimiento).toBe('cierre');
  });

  it('sobrante — arqueo mayor al esperado', () => {
    const result = calcularCierreTurno('200000', [{ denominacion: 50000, cantidad: 5 }]);
    expect(result.diferencia).toBe('50000.00');
    expect(result.tieneDiferencia).toBe(true);
  });

  it('faltante — arqueo menor al esperado', () => {
    const result = calcularCierreTurno('50000', [{ denominacion: 10000, cantidad: 3 }]);
    expect(result.diferencia).toBe('-20000.00');
    expect(result.tieneDiferencia).toBe(true);
  });

  it('denominaciones vacías — arqueo 0', () => {
    const result = calcularCierreTurno('0', []);
    expect(result.totalArqueo).toBe('0.00');
    expect(result.tieneDiferencia).toBe(false);
  });
});

describe('calcularDiferenciaCierre', () => {
  it('clasifica sobrante', () => {
    const result = calcularDiferenciaCierre('100000', '120000');
    expect(result.tipo).toBe('sobrante');
    expect(result.diferencia).toBe('20000.00');
    expect(result.diferenciaNeta).toBe('20000.00');
    expect(result.estado).toBe('pendiente');
  });

  it('clasifica faltante', () => {
    const result = calcularDiferenciaCierre('100000', '80000');
    expect(result.tipo).toBe('faltante');
    expect(result.diferencia).toBe('20000.00');
    expect(result.diferenciaNeta).toBe('-20000.00');
    expect(result.estado).toBe('pendiente');
  });

  it('cuadre exacto', () => {
    const result = calcularDiferenciaCierre('100000', '100000');
    expect(result.tipo).toBe('cuadre');
    expect(result.diferencia).toBe('0.00');
    expect(result.estado).toBe('cuadre');
  });

  it('ambos cero', () => {
    const result = calcularDiferenciaCierre('0', '0');
    expect(result.tipo).toBe('cuadre');
    expect(result.diferencia).toBe('0.00');
  });
});
