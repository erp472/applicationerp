import { describe, it, expect } from 'vitest';
import { calcularMonedaCirculante } from './moneda-circulante.js';

describe('calcularMonedaCirculante', () => {
  it('acumulado positivo → entrada', () => {
    const result = calcularMonedaCirculante('50');
    expect(result.monto).toBe('50.00');
    expect(result.esEntrada).toBe(true);
    expect(result.tipoMovimiento).toBe('moneda_circulante');
    expect(result.estado).toBe('pendiente');
  });

  it('acumulado negativo → salida', () => {
    const result = calcularMonedaCirculante('-30');
    expect(result.monto).toBe('30.00');
    expect(result.esEntrada).toBe(false);
  });

  it('acumulado cero → entrada con monto 0', () => {
    const result = calcularMonedaCirculante('0');
    expect(result.monto).toBe('0.00');
    expect(result.esEntrada).toBe(true);
  });

  it('fraccionario', () => {
    const result = calcularMonedaCirculante('12.50');
    expect(result.monto).toBe('12.50');
    expect(result.esEntrada).toBe(true);
  });
});
