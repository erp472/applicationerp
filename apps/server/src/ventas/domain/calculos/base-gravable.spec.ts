import { describe, it, expect } from 'vitest';
import { calcularBaseGravable } from './base-gravable.js';

describe('calcularBaseGravable', () => {
  it('una línea', () => {
    expect(calcularBaseGravable([{ precioSinTax: '10000', cantidad: 3 }])).toBe('30000');
  });

  it('varias líneas', () => {
    expect(
      calcularBaseGravable([
        { precioSinTax: '10000', cantidad: 2 },
        { precioSinTax: '5000', cantidad: 4 },
      ]),
    ).toBe('40000');
  });

  it('cantidad uno', () => {
    expect(calcularBaseGravable([{ precioSinTax: '84034', cantidad: 1 }])).toBe('84034');
  });

  it('lista vacía retorna cero', () => {
    expect(calcularBaseGravable([])).toBe('0');
  });

  it('precio cero', () => {
    expect(calcularBaseGravable([{ precioSinTax: '0', cantidad: 10 }])).toBe('0');
  });
});
