import { describe, it, expect } from 'vitest';
import { buildAnulacionVenta } from './anulacion-venta.js';

describe('buildAnulacionVenta', () => {
  it('estructura completa', () => {
    const r = buildAnulacionVenta('119000', 'venta_producto');
    expect(r.movimientoCaja.tipoMovimiento).toBe('anulacion');
    expect(r.movimientoCaja.monto).toBe('119000');
    expect(r.movimientoCaja.esEntrada).toBe(false);
    expect(r.movimientoCaja.descripcion).toContain('venta_producto');
    expect(r.estadoVenta).toBe('anulada');
    expect(r.estadoFactura).toBe('anulada');
    expect(r.revertirStock).toBe(true);
  });

  it('esEntrada siempre false', () => {
    expect(buildAnulacionVenta('50000', 'apartado_postal').movimientoCaja.esEntrada).toBe(false);
  });

  it('descripcion incluye tipo de movimiento', () => {
    expect(buildAnulacionVenta('50000', 'guia_postal').movimientoCaja.descripcion).toContain(
      'guia_postal',
    );
  });

  it('monto cero es válido', () => {
    const r = buildAnulacionVenta('0', 'venta_producto');
    expect(r.movimientoCaja.monto).toBe('0');
    expect(r.estadoVenta).toBe('anulada');
  });

  it('siempre revierte stock', () => {
    expect(buildAnulacionVenta('200000', 'venta_producto').revertirStock).toBe(true);
  });
});
