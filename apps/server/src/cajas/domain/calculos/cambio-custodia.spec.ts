import { describe, it, expect } from 'vitest';
import {
  calcularCambioCustodiaMidTurno,
  buildDebitoPrincipalPorApertura,
  buildCreditoAuxiliarPorApertura,
} from './cambio-custodia.js';

describe('calcularCambioCustodiaMidTurno', () => {
  it('genera par de movimientos correctos', () => {
    const result = calcularCambioCustodiaMidTurno('100000', '500000');
    expect(result.monto).toBe('100000');
    expect(result.movimientoPrincipal.tipoMovimiento).toBe('cambio_custodia_out');
    expect(result.movimientoPrincipal.esEntrada).toBe(false);
    expect(result.movimientoAuxiliar.tipoMovimiento).toBe('cambio_custodia_in');
    expect(result.movimientoAuxiliar.esEntrada).toBe(true);
    expect(result.movimientoAuxiliar.monto).toBe('100000');
  });

  it('monto exactamente igual al saldo', () => {
    const result = calcularCambioCustodiaMidTurno('500000', '500000');
    expect(result.monto).toBe('500000');
  });

  it('monto cero lanza error', () => {
    expect(() => calcularCambioCustodiaMidTurno('0', '500000')).toThrow('mayor a cero');
  });

  it('monto excede saldo lanza error', () => {
    expect(() => calcularCambioCustodiaMidTurno('600000', '500000')).toThrow('supera saldo');
  });
});

describe('buildDebitoPrincipalPorApertura', () => {
  it('genera movimiento de salida en principal', () => {
    const result = buildDebitoPrincipalPorApertura('150000');
    expect(result.tipoMovimiento).toBe('cambio_custodia_out');
    expect(result.esEntrada).toBe(false);
    expect(result.monto).toBe('150000');
  });
});

describe('buildCreditoAuxiliarPorApertura', () => {
  it('genera movimiento de entrada en auxiliar', () => {
    const result = buildCreditoAuxiliarPorApertura('150000');
    expect(result.tipoMovimiento).toBe('cambio_custodia_in');
    expect(result.esEntrada).toBe(true);
    expect(result.monto).toBe('150000');
  });
});
