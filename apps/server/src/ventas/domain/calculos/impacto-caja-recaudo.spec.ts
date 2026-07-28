import { describe, it, expect } from 'vitest';
import { buildImpactoCajaRecaudo } from './impacto-caja-recaudo.js';

describe('buildImpactoCajaRecaudo', () => {
  it('estructura correcta', () => {
    const r = buildImpactoCajaRecaudo('52000');
    expect(r.monto).toBe('52000');
    expect(r.tipoMovimiento).toBe('recaudo');
    expect(r.esEntrada).toBe(true);
  });

  it('aumenta saldo — esEntrada true', () => {
    expect(buildImpactoCajaRecaudo('100000').esEntrada).toBe(true);
  });

  it('monto cero', () => {
    const r = buildImpactoCajaRecaudo('0');
    expect(r.monto).toBe('0');
    expect(r.tipoMovimiento).toBe('recaudo');
  });

  it('tipo movimiento correcto', () => {
    expect(buildImpactoCajaRecaudo('999999').tipoMovimiento).toBe('recaudo');
  });
});
