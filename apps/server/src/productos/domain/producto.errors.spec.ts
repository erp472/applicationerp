import { describe, it, expect } from 'vitest';
import {
  ProductoDomainError,
  ProductoNotFoundError,
  ProductoCodigoDuplicadoError,
  ProductoPrecioInvalidoError,
  ProductoPesoInvalidoError,
  ProductoFactorVolumetricoInvalidoError,
  ProductoTipoInvalidoError,
  ProductoSucursalNoEncontradaError,
  ProductoYaAsignadoError,
  ProductoNoAsignadoError,
} from './producto.errors.js';

describe('Producto domain errors', () => {
  it('ProductoNotFoundError incluye id y statusCode 404', () => {
    const e = new ProductoNotFoundError(15);
    expect(e).toBeInstanceOf(ProductoDomainError);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('15');
  });

  it('ProductoCodigoDuplicadoError incluye código y statusCode 409', () => {
    const e = new ProductoCodigoDuplicadoError('EST-100G');
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('EST-100G');
  });

  it('ProductoPrecioInvalidoError tiene mensaje fijo y statusCode 400', () => {
    const e = new ProductoPrecioInvalidoError();
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('precio');
  });

  it('ProductoPesoInvalidoError tiene mensaje fijo y statusCode 400', () => {
    const e = new ProductoPesoInvalidoError();
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('peso');
  });

  it('ProductoFactorVolumetricoInvalidoError tiene mensaje fijo y statusCode 400', () => {
    const e = new ProductoFactorVolumetricoInvalidoError();
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('factor');
  });

  it('ProductoTipoInvalidoError incluye tipo y statusCode 400', () => {
    const e = new ProductoTipoInvalidoError('INVALIDO');
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('INVALIDO');
  });

  it('ProductoSucursalNoEncontradaError incluye sucursalId y statusCode 400', () => {
    const e = new ProductoSucursalNoEncontradaError(2);
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('2');
  });

  it('ProductoYaAsignadoError incluye productoId y sucursalId con statusCode 409', () => {
    const e = new ProductoYaAsignadoError(3, 7);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('3');
    expect(e.message).toContain('7');
  });

  it('ProductoNoAsignadoError incluye productoId y sucursalId con statusCode 404', () => {
    const e = new ProductoNoAsignadoError(4, 8);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('4');
    expect(e.message).toContain('8');
  });
});
