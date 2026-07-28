import { describe, it, expect } from 'vitest';
import { buildBaseAperturaPrincipal, calcularBaseAsignadaAuxiliar } from './base-apertura.js';

describe('buildBaseAperturaPrincipal', () => {
  it('retorna payload correcto para monto válido', () => {
    const result = buildBaseAperturaPrincipal('500000');
    expect(result.montoApertura).toBe('500000');
    expect(result.tipoMovimiento).toBe('apertura');
    expect(result.saldoInicial).toBe('500000');
  });

  it('monto cero lanza error', () => {
    expect(() => buildBaseAperturaPrincipal('0')).toThrow('mayor a cero');
  });

  it('monto negativo lanza error', () => {
    expect(() => buildBaseAperturaPrincipal('-100')).toThrow('mayor a cero');
  });
});

describe('calcularBaseAsignadaAuxiliar', () => {
  it('base válida', () => {
    const result = calcularBaseAsignadaAuxiliar('500000', '200000', false);
    expect(result.baseAsignada).toBe('200000');
    expect(result.saldoPrincipalRestante).toBe('300000.00');
  });

  it('saldo exactamente igual a la base', () => {
    const result = calcularBaseAsignadaAuxiliar('200000', '200000', false);
    expect(result.saldoPrincipalRestante).toBe('0.00');
  });

  it('auxiliar con sesión abierta lanza error', () => {
    expect(() => calcularBaseAsignadaAuxiliar('500000', '200000', true)).toThrow('sesión abierta');
  });

  it('base cero lanza error', () => {
    expect(() => calcularBaseAsignadaAuxiliar('500000', '0', false)).toThrow('mayor a cero');
  });

  it('saldo insuficiente lanza error', () => {
    expect(() => calcularBaseAsignadaAuxiliar('100000', '200000', false)).toThrow('insuficiente');
  });
});
