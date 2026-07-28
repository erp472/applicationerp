import { describe, it, expect } from 'vitest';
import { buildImpactoCajaGiroEmision } from './impacto-caja-giro-emision.js';

describe('buildImpactoCajaGiroEmision', () => {
  it('estructura correcta', () => {
    const r = buildImpactoCajaGiroEmision('515000');
    expect(r.monto).toBe('515000');
    expect(r.tipoMovimiento).toBe('giro_emision_cobro');
    expect(r.esEntrada).toBe(true);
  });

  it('aumenta caja — esEntrada true', () => {
    expect(buildImpactoCajaGiroEmision('200000').esEntrada).toBe(true);
  });

  it('monto grande', () => {
    const r = buildImpactoCajaGiroEmision('10000000');
    expect(r.monto).toBe('10000000');
    expect(r.tipoMovimiento).toBe('giro_emision_cobro');
  });
});
