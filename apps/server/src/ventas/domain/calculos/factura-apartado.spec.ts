import { describe, it, expect } from 'vitest';
import { buildFacturaApartado } from './factura-apartado.js';

describe('buildFacturaApartado', () => {
  it('estructura completa con email', () => {
    const result = buildFacturaApartado(10, '119000', '19000', '100000', 7, 'test@correo.com');
    expect(result.venta.clienteId).toBe(7);
    expect(result.venta.apartadoPostalId).toBe(10);
    expect(result.venta.subtotal).toBe('100000');
    expect(result.venta.iva).toBe('19000');
    expect(result.venta.descuento).toBe('0');
    expect(result.venta.total).toBe('119000');
    expect(result.detalle.descripcion).toBe('Apartado postal #10');
    expect(result.detalle.cantidad).toBe(1);
    expect(result.detalle.precioUnitario).toBe('100000');
    expect(result.detalle.ivaUnitario).toBe('19000');
    expect(result.detalle.subtotal).toBe('119000');
    expect(result.factura.emailFactura).toBe('test@correo.com');
    expect(result.factura.apartadoPostalId).toBe(10);
  });

  it('sin email retorna null', () => {
    const result = buildFacturaApartado(1, '87500', '0', '87500', 3);
    expect(result.factura.emailFactura).toBeNull();
  });

  it('descuento siempre cero', () => {
    const result = buildFacturaApartado(2, '50000', '5000', '45000', 1);
    expect(result.venta.descuento).toBe('0');
  });
});
