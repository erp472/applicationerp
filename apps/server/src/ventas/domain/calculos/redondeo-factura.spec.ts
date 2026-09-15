import { describe, it, expect } from 'vitest';
import { calcularRedondeoFactura } from './redondeo-factura.js';

describe('calcularRedondeoFactura', () => {
  it('ya es entero — diferencia cero', () => {
    const r = calcularRedondeoFactura('50000');
    expect(r.totalRedondeado).toBe('50000');
    expect(r.diferenciaMonedaCirculante).toBe(0);
  });

  it('decimal .5 redondea hacia arriba', () => {
    const r = calcularRedondeoFactura('50000.5');
    expect(r.totalRedondeado).toBe('50001');
    expect(r.diferenciaMonedaCirculante).toBeCloseTo(0.5);
  });

  it('decimal .4 redondea hacia abajo', () => {
    const r = calcularRedondeoFactura('50000.4');
    expect(r.totalRedondeado).toBe('50000');
    expect(r.diferenciaMonedaCirculante).toBeCloseTo(-0.4);
  });

  it('total cero', () => {
    const r = calcularRedondeoFactura('0');
    expect(r.totalRedondeado).toBe('0');
    expect(r.diferenciaMonedaCirculante).toBe(0);
  });
});
