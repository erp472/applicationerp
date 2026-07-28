import { describe, it, expect } from 'vitest';
import { buildImpactoCajaGiroPago } from './impacto-caja-giro-pago.js';

describe('buildImpactoCajaGiroPago', () => {
  it('estructura correcta', () => {
    const r = buildImpactoCajaGiroPago('350000');
    expect(r.monto).toBe('350000');
    expect(r.tipoMovimiento).toBe('giro_pago');
    expect(r.esEntrada).toBe(false);
  });

  it('disminuye caja — esEntrada false', () => {
    expect(buildImpactoCajaGiroPago('100000').esEntrada).toBe(false);
  });

  it('monto cero es válido', () => {
    const r = buildImpactoCajaGiroPago('0');
    expect(r.monto).toBe('0');
    expect(r.tipoMovimiento).toBe('giro_pago');
  });
});
