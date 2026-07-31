import { describe, it, expect } from 'vitest';
import { calcularSaldoCajaFuerte } from './saldo-caja-fuerte.js';

describe('calcularSaldoCajaFuerte', () => {
  it('saldo base + devoluciones de auxiliares', () => {
    const result = calcularSaldoCajaFuerte(
      '500000',
      [{ monto: '50000', esEntrada: false }],
      ['100000', '80000'],
    );
    // 500000 - 50000 (salida) = 450000 + 100000 + 80000 devoluciones = 630000
    expect(result).toBe('630000.00');
  });

  it('sin devoluciones — solo saldo de sesión general', () => {
    expect(calcularSaldoCajaFuerte('300000', [], [])).toBe('300000.00');
  });

  it('solo devoluciones sin movimientos', () => {
    expect(calcularSaldoCajaFuerte('200000', [], ['50000', '30000'])).toBe('280000.00');
  });

  it('múltiples movimientos entrada y salida', () => {
    const result = calcularSaldoCajaFuerte(
      '1000000',
      [
        { monto: '200000', esEntrada: true  },  // recepción de auxiliar
        { monto: '50000',  esEntrada: false },  // traslado a bóveda
      ],
      ['80000'],
    );
    // 1000000 + 200000 - 50000 + 80000 = 1230000
    expect(result).toBe('1230000.00');
  });

  it('saldo negativo permitido (diferencia faltante)', () => {
    const result = calcularSaldoCajaFuerte(
      '100000',
      [{ monto: '150000', esEntrada: false }],
      [],
    );
    expect(result).toBe('-50000.00');
  });

  it('apertura cero con una devolución', () => {
    expect(calcularSaldoCajaFuerte('0', [], ['500000'])).toBe('500000.00');
  });
});
