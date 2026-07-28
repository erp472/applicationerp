import { describe, it, expect } from 'vitest';
import { calcularSaldoCaja } from './saldo-caja.js';

describe('calcularSaldoCaja', () => {
  it('suma entradas y resta salidas sobre la base', () => {
    const movs = [
      { monto: '200000', esEntrada: true },
      { monto: '50000', esEntrada: false },
      { monto: '100000', esEntrada: true },
    ];
    expect(calcularSaldoCaja('300000', movs)).toBe('550000.00');
  });

  it('retorna la base cuando no hay movimientos', () => {
    expect(calcularSaldoCaja('300000', [])).toBe('300000.00');
  });

  it('solo salidas', () => {
    const movs = [
      { monto: '100000', esEntrada: false },
      { monto: '50000', esEntrada: false },
    ];
    expect(calcularSaldoCaja('300000', movs)).toBe('150000.00');
  });

  it('base cero con una entrada', () => {
    expect(calcularSaldoCaja('0', [{ monto: '100000', esEntrada: true }])).toBe('100000.00');
  });

  it('aplica igualmente a sesiones auxiliares', () => {
    const movs = [
      { monto: '50000', esEntrada: true },
      { monto: '20000', esEntrada: false },
      { monto: '30000', esEntrada: true },
    ];
    expect(calcularSaldoCaja('100000', movs)).toBe('160000.00');
  });

  it('solo egresos en auxiliar', () => {
    const movs = [
      { monto: '60000', esEntrada: false },
      { monto: '40000', esEntrada: false },
    ];
    expect(calcularSaldoCaja('200000', movs)).toBe('100000.00');
  });
});
