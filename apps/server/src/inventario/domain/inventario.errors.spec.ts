import { describe, it, expect } from 'vitest';
import {
  InventarioDomainError,
  StockInsuficienteInventarioError,
  ProductoNoEnInventarioError,
} from './inventario.errors.js';

describe('Inventario domain errors', () => {
  it('StockInsuficienteInventarioError expone stockActual y cantidadRequerida', () => {
    const e = new StockInsuficienteInventarioError('Estampilla 100g', 3, 10);
    expect(e).toBeInstanceOf(InventarioDomainError);
    expect(e.stockActual).toBe(3);
    expect(e.cantidadRequerida).toBe(10);
    expect(e.code).toBe('STOCK_INSUFICIENTE');
    expect(e.message).toContain('Estampilla 100g');
    expect(e.message).toContain('3');
    expect(e.message).toContain('10');
    expect(e.name).toBe('StockInsuficienteInventarioError');
  });

  it('ProductoNoEnInventarioError incluye productoId y sucursalId', () => {
    const e = new ProductoNoEnInventarioError(5, 2);
    expect(e).toBeInstanceOf(InventarioDomainError);
    expect(e.message).toContain('5');
    expect(e.message).toContain('2');
    expect(e.name).toBe('ProductoNoEnInventarioError');
  });

  it('InventarioDomainError usa statusCode 400 por defecto', () => {
    const e = new ProductoNoEnInventarioError(1, 1);
    expect(e.statusCode).toBe(400);
  });
});
