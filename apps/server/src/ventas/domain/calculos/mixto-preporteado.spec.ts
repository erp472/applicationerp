import { describe, it, expect } from 'vitest';
import { buildMixtoPreporteado } from './mixto-preporteado.js';

describe('buildMixtoPreporteado', () => {
  it('suma correcta genera dos movimientos', () => {
    const r = buildMixtoPreporteado('10000', '5000', '15000');
    expect(r.movimientoPreporteado.tipoMovimiento).toBe('preporteado');
    expect(r.movimientoPreporteado.monto).toBe('10000');
    expect(r.movimientoPreporteado.esEntrada).toBe(true);
    expect(r.movimientoEfectivo.tipoMovimiento).toBe('efectivo');
    expect(r.movimientoEfectivo.monto).toBe('5000');
    expect(r.movimientoEfectivo.esEntrada).toBe(true);
  });

  it('suma de movimientos iguala el total', () => {
    const r = buildMixtoPreporteado('7000', '8000', '15000');
    const total = Number(r.movimientoPreporteado.monto) + Number(r.movimientoEfectivo.monto);
    expect(total).toBe(15000);
  });

  it('no cuadra lanza error', () => {
    expect(() => buildMixtoPreporteado('10000', '5000', '20000')).toThrow('no cuadra');
  });

  it('estampillas cero lanza error', () => {
    expect(() => buildMixtoPreporteado('0', '15000', '15000')).toThrow('mayor a cero');
  });

  it('efectivo cero lanza error', () => {
    expect(() => buildMixtoPreporteado('15000', '0', '15000')).toThrow('mayor a cero');
  });

  it('estampillas negativas lanza error', () => {
    expect(() => buildMixtoPreporteado('-1000', '16000', '15000')).toThrow();
  });
});
