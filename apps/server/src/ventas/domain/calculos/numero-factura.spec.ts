import { describe, it, expect } from 'vitest';
import { generarNumeroFactura } from './numero-factura.js';

describe('generarNumeroFactura', () => {
  it('formato básico 8 dígitos', () => {
    expect(generarNumeroFactura('FVE', 1)).toBe('FVE00000001');
  });

  it('consecutivo grande', () => {
    expect(generarNumeroFactura('FVE', 12345678)).toBe('FVE12345678');
  });

  it('dígitos de relleno personalizados', () => {
    expect(generarNumeroFactura('NC', 5, 4)).toBe('NC0005');
  });

  it('consecutivo cero lanza error', () => {
    expect(() => generarNumeroFactura('FVE', 0)).toThrow('consecutivo debe ser mayor a cero');
  });

  it('consecutivo negativo lanza error', () => {
    expect(() => generarNumeroFactura('FVE', -1)).toThrow('consecutivo debe ser mayor a cero');
  });

  it('prefijo vacío', () => {
    expect(generarNumeroFactura('', 1)).toBe('00000001');
  });
});
