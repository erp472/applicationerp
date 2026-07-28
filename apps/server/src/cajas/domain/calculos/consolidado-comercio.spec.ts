import { describe, it, expect } from 'vitest';
import { consolidarComercio, type RegionalConsolidado } from './consolidado-comercio.js';

function makeRegional(efectivo: string, tarjetaDebito = '0', transferencia = '0'): RegionalConsolidado {
  return {
    porMedio: {
      efectivo,
      tarjetaDebito,
      tarjetaCredito: '0',
      transferencia,
      consignacion: '0',
      preporteado: '0',
      mixtoPreporteado: '0',
    },
  };
}

describe('consolidarComercio', () => {
  it('suma regionales', () => {
    const r = consolidarComercio([
      makeRegional('200000', '100000'),
      makeRegional('150000', '80000'),
    ]);
    expect(r.numRegionales).toBe(2);
    expect(r.porMedio.efectivo).toBe('350000');
    expect(r.porMedio.tarjetaDebito).toBe('180000');
    expect(r.total).toBe('530000');
  });

  it('sin regionales', () => {
    const r = consolidarComercio([]);
    expect(r.numRegionales).toBe(0);
    expect(r.total).toBe('0');
  });

  it('una regional', () => {
    const r = consolidarComercio([makeRegional('75000', '0', '25000')]);
    expect(r.numRegionales).toBe(1);
    expect(r.porMedio.efectivo).toBe('75000');
    expect(r.porMedio.transferencia).toBe('25000');
    expect(r.total).toBe('100000');
  });
});
