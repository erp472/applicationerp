import { describe, it, expect } from 'vitest';
import { calcularImpactoInventarioEspecial, calcularRestaurarInventarioEspecial } from './inventario-especial.js';

describe('calcularImpactoInventarioEspecial', () => {
  it('caso normal', () => {
    const result = calcularImpactoInventarioEspecial(20, 5, 10, 3);
    expect(result.nuevoStock).toBe(15);
    expect(result.movimientoInventario.tipo).toBe('salida');
    expect(result.movimientoInventario.cantidad).toBe(5);
    expect(result.movimientoInventario.productoId).toBe(10);
    expect(result.movimientoInventario.sucursalId).toBe(3);
  });

  it('consume todo el stock', () => {
    const result = calcularImpactoInventarioEspecial(5, 5, 1, 1);
    expect(result.nuevoStock).toBe(0);
  });

  it('cantidad cero lanza error', () => {
    expect(() => calcularImpactoInventarioEspecial(10, 0, 1, 1)).toThrow('mayor a cero');
  });

  it('stock insuficiente lanza error', () => {
    expect(() => calcularImpactoInventarioEspecial(3, 5, 1, 1)).toThrow('insuficiente');
  });
});

describe('calcularRestaurarInventarioEspecial', () => {
  it('caso normal', () => {
    const result = calcularRestaurarInventarioEspecial(10, 5, 7, 2);
    expect(result.nuevoStock).toBe(15);
    expect(result.movimientoInventario.tipo).toBe('devolucion');
    expect(result.movimientoInventario.cantidad).toBe(5);
    expect(result.movimientoInventario.productoId).toBe(7);
    expect(result.movimientoInventario.sucursalId).toBe(2);
  });

  it('desde stock cero', () => {
    const result = calcularRestaurarInventarioEspecial(0, 3, 5, 1);
    expect(result.nuevoStock).toBe(3);
  });

  it('cantidad cero lanza error', () => {
    expect(() => calcularRestaurarInventarioEspecial(10, 0, 1, 1)).toThrow('mayor a cero');
  });

  it('cantidad negativa lanza error', () => {
    expect(() => calcularRestaurarInventarioEspecial(10, -2, 1, 1)).toThrow('mayor a cero');
  });
});
