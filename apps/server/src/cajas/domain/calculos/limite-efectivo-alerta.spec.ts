import { describe, it, expect } from 'vitest';
import { evaluarLimiteEfectivo } from './limite-efectivo-alerta.js';

describe('evaluarLimiteEfectivo', () => {
  it('supera el límite', () => {
    const result = evaluarLimiteEfectivo('600000', '500000');
    expect(result.superaLimite).toBe(true);
    expect(result.excedente).toBe('100000.00');
    expect(result.tipoAlerta).toBe('limite_efectivo_caja');
  });

  it('no supera el límite', () => {
    const result = evaluarLimiteEfectivo('400000', '500000');
    expect(result.superaLimite).toBe(false);
    expect(result.excedente).toBe('0.00');
    expect(result.tipoAlerta).toBeNull();
  });

  it('exactamente en el límite — no supera', () => {
    const result = evaluarLimiteEfectivo('500000', '500000');
    expect(result.superaLimite).toBe(false);
    expect(result.excedente).toBe('0.00');
    expect(result.tipoAlerta).toBeNull();
  });
});
