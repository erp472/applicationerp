import { describe, it, expect } from 'vitest';
import { calcularSaldoCajaFuerte } from './saldo-caja-fuerte.js';

describe('calcularSaldoCajaFuerte', () => {
  it('saldo base + devoluciones de auxiliares', () => {
    const result = calcularSaldoCajaFuerte(
      '500000',
      [{ monto: '50000', esEntrada: false }],
      ['100000', '80000'],
    );
    expect(result).toBe('630000.00');
  });

  it('sin devoluciones — solo saldo de sesión general', () => {
    expect(calcularSaldoCajaFuerte('300000', [], [])).toBe('300000.00');
  });

  it('solo devoluciones sin movimientos', () => {
    expect(calcularSaldoCajaFuerte('200000', [], ['50000', '30000'])).toBe('280000.00');
  });
});
