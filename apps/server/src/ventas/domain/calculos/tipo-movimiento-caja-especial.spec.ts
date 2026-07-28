import { describe, it, expect } from 'vitest';
import { resolverTipoMovimientoCajaEspecial } from './tipo-movimiento-caja-especial.js';

describe('resolverTipoMovimientoCajaEspecial', () => {
  it('solo estampilla → venta_estampilla', () => {
    expect(resolverTipoMovimientoCajaEspecial(['estampilla'])).toBe('venta_estampilla');
  });

  it('solo filatelia → venta_estampilla', () => {
    expect(resolverTipoMovimientoCajaEspecial(['filatelia'])).toBe('venta_estampilla');
  });

  it('estampilla y filatelia → venta_estampilla', () => {
    expect(resolverTipoMovimientoCajaEspecial(['estampilla', 'filatelia'])).toBe('venta_estampilla');
  });

  it('tipo otro → venta_servicio', () => {
    expect(resolverTipoMovimientoCajaEspecial(['otro'])).toBe('venta_servicio');
  });

  it('otro + estampilla → venta_servicio', () => {
    expect(resolverTipoMovimientoCajaEspecial(['otro', 'estampilla'])).toBe('venta_servicio');
  });

  it('lista vacía lanza error', () => {
    expect(() => resolverTipoMovimientoCajaEspecial([])).toThrow('no tiene ítems');
  });
});
