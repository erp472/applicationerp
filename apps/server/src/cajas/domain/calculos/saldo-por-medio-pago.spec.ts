import { describe, it, expect } from 'vitest';
import { calcularSaldoPorMedioPago } from './saldo-por-medio-pago.js';

describe('calcularSaldoPorMedioPago', () => {
  it('calcula saldo neto por medio', () => {
    const result = calcularSaldoPorMedioPago([
      { medioPago: 'efectivo', monto: '100000', esEntrada: true },
      { medioPago: 'efectivo', monto: '30000', esEntrada: false },
      { medioPago: 'tarjeta_debito', monto: '50000', esEntrada: true },
      { medioPago: 'transferencia', monto: '20000', esEntrada: true },
    ]);
    expect(result.efectivo).toBe('70000.00');
    expect(result.tarjeta_debito).toBe('50000.00');
    expect(result.transferencia).toBe('20000.00');
    expect(result.tarjeta_credito).toBe('0.00');
  });

  it('lista vacía — todos en cero', () => {
    const result = calcularSaldoPorMedioPago([]);
    for (const v of Object.values(result)) expect(v).toBe('0.00');
  });

  it('medio inválido lanza error', () => {
    expect(() =>
      calcularSaldoPorMedioPago([{ medioPago: 'bitcoin', monto: '50000', esEntrada: true }]),
    ).toThrow('Medio de pago desconocido: bitcoin');
  });

  it('sin medioPago usa efectivo por defecto', () => {
    const result = calcularSaldoPorMedioPago([{ monto: '80000', esEntrada: true }]);
    expect(result.efectivo).toBe('80000.00');
  });
});
