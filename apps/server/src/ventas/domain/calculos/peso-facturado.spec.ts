import { describe, it, expect } from 'vitest';
import { calcularPesoFacturado } from './peso-facturado.js';

describe('calcularPesoFacturado', () => {
  it('físico mayor', () => {
    expect(calcularPesoFacturado(5, 2)).toBe(5);
  });

  it('volumétrico mayor', () => {
    expect(calcularPesoFacturado(2, 5)).toBe(5);
  });

  it('sin volumétrico retorna físico', () => {
    expect(calcularPesoFacturado(3)).toBe(3);
  });

  it('iguales retorna el mismo valor', () => {
    expect(calcularPesoFacturado(4, 4)).toBe(4);
  });

  it('volumétrico null retorna físico', () => {
    expect(calcularPesoFacturado(7, undefined)).toBe(7);
  });
});
