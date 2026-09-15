import { describe, it, expect } from 'vitest';
import { calcularTotalCarrito } from './total-carrito.js';

describe('calcularTotalCarrito', () => {
  it('una sola línea', () => {
    const result = calcularTotalCarrito([
      { precioSinTax: 10000, ivaUnitario: 1900, cantidad: 2, descuentoMonto: 0 },
    ]);
    expect(result.subtotalSinIva).toBe('20000.00');
    expect(result.ivaTotal).toBe('3800.00');
    expect(result.descuentoTotal).toBe('0.00');
    expect(result.total).toBe('23800.00');
  });

  it('múltiples líneas con descuento', () => {
    const result = calcularTotalCarrito([
      { precioSinTax: 5000, ivaUnitario: 950, cantidad: 2, descuentoMonto: 1000 },
      { precioSinTax: 8000, ivaUnitario: 1520, cantidad: 1, descuentoMonto: 0 },
    ]);
    expect(result.subtotalSinIva).toBe('18000.00');
    expect(result.ivaTotal).toBe('3420.00');
    expect(result.descuentoTotal).toBe('1000.00');
    expect(result.total).toBe('20420.00');
  });

  it('lista vacía', () => {
    const result = calcularTotalCarrito([]);
    expect(result.subtotalSinIva).toBe('0.00');
    expect(result.total).toBe('0.00');
  });

  it('campo descuentoMonto opcional usa 0', () => {
    const result = calcularTotalCarrito([
      { precioSinTax: 3000, ivaUnitario: 570, cantidad: 1 },
    ]);
    expect(result.descuentoTotal).toBe('0.00');
    expect(result.total).toBe('3570.00');
  });
});
