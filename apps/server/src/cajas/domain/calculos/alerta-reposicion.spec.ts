import { describe, it, expect } from 'vitest';
import { evaluarAlertaReposicion } from './alerta-reposicion.js';

describe('evaluarAlertaReposicion', () => {
  it('necesita reposición cuando saldo < base', () => {
    const result = evaluarAlertaReposicion('50000', '200000');
    expect(result.necesitaReposicion).toBe(true);
    expect(result.faltante).toBe('150000.00');
    expect(result.tipoAlerta).toBe('reposicion_caja');
  });

  it('no necesita reposición cuando saldo > base', () => {
    const result = evaluarAlertaReposicion('300000', '200000');
    expect(result.necesitaReposicion).toBe(false);
    expect(result.faltante).toBe('0.00');
    expect(result.tipoAlerta).toBeNull();
  });

  it('exactamente en la base — no necesita reposición', () => {
    const result = evaluarAlertaReposicion('200000', '200000');
    expect(result.necesitaReposicion).toBe(false);
    expect(result.faltante).toBe('0.00');
  });

  it('saldo cero', () => {
    const result = evaluarAlertaReposicion('0', '200000');
    expect(result.necesitaReposicion).toBe(true);
    expect(result.faltante).toBe('200000.00');
  });
});
