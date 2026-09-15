import { describe, it, expect } from 'vitest';
import { validarProductoActivoSucursal } from './validar-producto-activo.js';

describe('validarProductoActivoSucursal', () => {
  it('producto activo no lanza error', () => {
    expect(validarProductoActivoSucursal(true, 10, 2)).toBeUndefined();
  });

  it('producto inactivo lanza error', () => {
    expect(() => validarProductoActivoSucursal(false, 10, 2)).toThrow('no está habilitado');
  });

  it('mensaje incluye el id del producto', () => {
    expect(() => validarProductoActivoSucursal(false, 10, 3)).toThrow('10');
  });
});
