import { describe, it, expect } from 'vitest';
import { calcularTrasladoCajaFuerte } from './traslado-caja-fuerte.js';

describe('calcularTrasladoCajaFuerte', () => {
  it('traslado válido', () => {
    const result = calcularTrasladoCajaFuerte('200000', '500000');
    expect(result.monto).toBe('200000');
    expect(result.tipoMovimiento).toBe('traslado_caja_fuerte');
    expect(result.esEntrada).toBe(false);
    expect(result.saldoDespues).toBe('300000.00');
  });

  it('monto exactamente igual al saldo', () => {
    const result = calcularTrasladoCajaFuerte('500000', '500000');
    expect(result.saldoDespues).toBe('0.00');
  });

  it('monto cero lanza error', () => {
    expect(() => calcularTrasladoCajaFuerte('0', '500000')).toThrow('mayor a cero');
  });

  it('monto excede saldo lanza error', () => {
    expect(() => calcularTrasladoCajaFuerte('600000', '500000')).toThrow('supera el saldo');
  });
});
