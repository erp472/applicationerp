import { describe, it, expect } from 'vitest';
import { consolidarComercio, type RegionalConsolidado } from './consolidado-comercio.js';

function makeRegional(id: number, efectivo: string, tarjetaDebito = '0', transferencia = '0'): RegionalConsolidado {
  return {
    regionalId: id,
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
    const r = consolidarComercio(1, [
      makeRegional(1, '200000', '100000'),
      makeRegional(2, '150000', '80000'),
    ]);
    expect(r.comercioId).toBe(1);
    expect(r.numRegionales).toBe(2);
    expect(r.porMedio.efectivo).toBe('350000');
    expect(r.porMedio.tarjetaDebito).toBe('180000');
    expect(r.total).toBe('530000');
  });

  it('sin regionales', () => {
    const r = consolidarComercio(1, []);
    expect(r.comercioId).toBe(1);
    expect(r.numRegionales).toBe(0);
    expect(r.total).toBe('0');
  });

  it('una regional', () => {
    const r = consolidarComercio(2, [makeRegional(3, '75000', '0', '25000')]);
    expect(r.comercioId).toBe(2);
    expect(r.numRegionales).toBe(1);
    expect(r.porMedio.efectivo).toBe('75000');
    expect(r.porMedio.transferencia).toBe('25000');
    expect(r.total).toBe('100000');
  });

  it('todos los medios presentes en resultado aunque sean cero', () => {
    const r = consolidarComercio(1, [makeRegional(1, '0')]);
    expect(r.porMedio).toHaveProperty('efectivo');
    expect(r.porMedio).toHaveProperty('tarjetaDebito');
    expect(r.porMedio).toHaveProperty('tarjetaCredito');
    expect(r.porMedio).toHaveProperty('transferencia');
    expect(r.porMedio).toHaveProperty('consignacion');
    expect(r.porMedio).toHaveProperty('preporteado');
    expect(r.porMedio).toHaveProperty('mixtoPreporteado');
  });

  it('comercioId preservado en resultado', () => {
    const r = consolidarComercio(99, []);
    expect(r.comercioId).toBe(99);
  });

  it('total es suma de todos los medios', () => {
    const r = consolidarComercio(1, [
      makeRegional(1, '100000', '50000', '30000'),
    ]);
    const sumaMedios = Object.values(r.porMedio).reduce((a, b) => Number(a) + Number(b), 0);
    expect(Number(r.total)).toBe(sumaMedios);
  });
});
