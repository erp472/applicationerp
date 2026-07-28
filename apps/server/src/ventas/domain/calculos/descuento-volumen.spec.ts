import { describe, it, expect } from 'vitest';
import { calcularDescuentoVolumen } from './descuento-volumen.js';

describe('calcularDescuentoVolumen', () => {
  const tarifas = [
    { minCantidad: 1, maxCantidad: 10, precioUnitario: '5000' },
    { minCantidad: 11, maxCantidad: 50, precioUnitario: '4500' },
  ];

  it('encuentra el tramo correcto', () => {
    expect(calcularDescuentoVolumen(tarifas, 15, '6000')).toBe('4500');
  });

  it('límite inferior del tramo', () => {
    expect(calcularDescuentoVolumen(tarifas, 1, '6000')).toBe('5000');
  });

  it('límite superior del tramo', () => {
    expect(calcularDescuentoVolumen(tarifas, 10, '6000')).toBe('5000');
  });

  it('sin tramo que aplique retorna precio_base', () => {
    expect(calcularDescuentoVolumen(tarifas, 99, '6000')).toBe('6000');
  });

  it('lista vacía retorna precio_base', () => {
    expect(calcularDescuentoVolumen([], 5, '7000')).toBe('7000');
  });
});
