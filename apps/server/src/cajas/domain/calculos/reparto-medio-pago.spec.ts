import { describe, it, expect } from 'vitest';
import { repartirPagoPorMedio } from './reparto-medio-pago.js';

describe('repartirPagoPorMedio', () => {
  it('deja un solo movimiento cuando el pago es en efectivo', () => {
    expect(repartirPagoPorMedio('5250', 'efectivo', undefined)).toEqual([
      { monto: '5250', medioPago: 'efectivo' },
    ]);
  });

  it('deja un solo movimiento cuando no hay medio de pago (movimiento interno)', () => {
    expect(repartirPagoPorMedio('96224', undefined, undefined)).toEqual([
      { monto: '96224', medioPago: undefined },
    ]);
  });

  it('parte un pago mixto en porción no-efectivo y porción efectivo', () => {
    expect(repartirPagoPorMedio('5250', 'mixto_preporteado', 2750)).toEqual([
      { monto: '2500.00', medioPago: 'mixto_preporteado' },
      { monto: '2750.00', medioPago: 'efectivo' },
    ]);
  });

  it('las partes suman el monto original — no duplica facturación', () => {
    const partes = repartirPagoPorMedio('129000', 'mixto_preporteado', 114000);
    const suma = partes.reduce((acc, p) => acc + Number(p.monto), 0);
    expect(suma).toBe(129000);
  });

  it('no acredita efectivo en un preporteado puro', () => {
    expect(repartirPagoPorMedio('87500', 'preporteado', undefined)).toEqual([
      { monto: '87500', medioPago: 'preporteado' },
    ]);
  });

  it('no acredita efectivo en un pago con tarjeta', () => {
    expect(repartirPagoPorMedio('350000', 'tarjeta_credito', 0)).toEqual([
      { monto: '350000', medioPago: 'tarjeta_credito' },
    ]);
  });

  it('convierte a efectivo cuando la porción cubre el total', () => {
    expect(repartirPagoPorMedio('3300', 'estampilla', 3300)).toEqual([
      { monto: '3300', medioPago: 'efectivo' },
    ]);
  });

  it('acota el efectivo declarado al monto del movimiento', () => {
    expect(repartirPagoPorMedio('3300', 'estampilla', 99999)).toEqual([
      { monto: '3300', medioPago: 'efectivo' },
    ]);
  });

  it('ignora un efectivo negativo', () => {
    expect(repartirPagoPorMedio('3300', 'estampilla', -500)).toEqual([
      { monto: '3300', medioPago: 'estampilla' },
    ]);
  });
});
