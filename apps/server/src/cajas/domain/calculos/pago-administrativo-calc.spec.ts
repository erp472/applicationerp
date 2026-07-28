import { describe, it, expect } from 'vitest';
import { buildPagoAdministrativo } from './pago-administrativo-calc.js';

describe('buildPagoAdministrativo', () => {
  it('pago válido', () => {
    const result = buildPagoAdministrativo('50000', 'Compra de insumos de oficina', '300000');
    expect(result.monto).toBe('50000');
    expect(result.descripcion).toBe('Compra de insumos de oficina');
    expect(result.tipoMovimiento).toBe('pago_administrativo');
    expect(result.esEntrada).toBe(false);
    expect(result.saldoDespues).toBe('250000.00');
  });

  it('monto exactamente igual al saldo', () => {
    const result = buildPagoAdministrativo('300000', 'Pago total', '300000');
    expect(result.saldoDespues).toBe('0.00');
  });

  it('monto cero lanza error', () => {
    expect(() => buildPagoAdministrativo('0', 'desc', '300000')).toThrow('mayor a cero');
  });

  it('descripción vacía lanza error', () => {
    expect(() => buildPagoAdministrativo('50000', '', '300000')).toThrow('obligatoria');
  });

  it('descripción solo espacios lanza error', () => {
    expect(() => buildPagoAdministrativo('50000', '   ', '300000')).toThrow('obligatoria');
  });

  it('monto excede saldo lanza error', () => {
    expect(() => buildPagoAdministrativo('400000', 'desc', '300000')).toThrow('supera el saldo');
  });

  it('descripción se recorta', () => {
    const result = buildPagoAdministrativo('10000', '  recibo  ', '100000');
    expect(result.descripcion).toBe('recibo');
  });
});
