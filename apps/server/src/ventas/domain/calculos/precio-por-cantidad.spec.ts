import { describe, it, expect } from 'vitest';
import { calcularPrecioPorCantidad } from './precio-por-cantidad.js';

const tarifas = [
  { minCantidad: 1, maxCantidad: 10, precioUnitario: '3000' },
  { minCantidad: 11, maxCantidad: 50, precioUnitario: '2500' },
];

describe('calcularPrecioPorCantidad', () => {
  it('encuentra el tramo correcto', () => {
    expect(calcularPrecioPorCantidad(tarifas, 15)).toBe('2500');
  });

  it('límite inferior del tramo', () => {
    expect(calcularPrecioPorCantidad(tarifas, 1)).toBe('3000');
  });

  it('límite superior del tramo', () => {
    expect(calcularPrecioPorCantidad(tarifas, 10)).toBe('3000');
  });

  it('fuera de tramos lanza error', () => {
    expect(() => calcularPrecioPorCantidad(tarifas, 51)).toThrow('no está cubierta');
  });

  it('lista vacía lanza error', () => {
    expect(() => calcularPrecioPorCantidad([], 1)).toThrow('no está cubierta');
  });
});
