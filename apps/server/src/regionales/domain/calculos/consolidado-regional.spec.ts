import { describe, it, expect } from 'vitest';
import { consolidarRegional, type SaldoSucursal } from './consolidado-regional.js';

const SUCURSALES: SaldoSucursal[] = [
  {
    sucursalId: 1,
    efectivo: '100000',
    tarjetaDebito: '50000',
    tarjetaCredito: '30000',
    transferencia: '20000',
    consignacion: '10000',
    preporteado: '5000',
    mixtoPreporteado: '2000',
  },
  {
    sucursalId: 2,
    efectivo: '80000',
    tarjetaDebito: '40000',
    tarjetaCredito: '20000',
    transferencia: '15000',
    consignacion: '8000',
    preporteado: '3000',
    mixtoPreporteado: '1000',
  },
];

describe('consolidarRegional', () => {
  it('suma saldos correctamente', () => {
    const r = consolidarRegional(SUCURSALES);
    expect(r.numSucursales).toBe(2);
    expect(r.porMedio.efectivo).toBe('180000');
    expect(r.porMedio.tarjetaDebito).toBe('90000');
    expect(r.porMedio.tarjetaCredito).toBe('50000');
    expect(r.porMedio.transferencia).toBe('35000');
    expect(r.porMedio.consignacion).toBe('18000');
    expect(r.porMedio.preporteado).toBe('8000');
    expect(r.porMedio.mixtoPreporteado).toBe('3000');
    expect(r.total).toBe('384000');
  });

  it('lista vacía', () => {
    const r = consolidarRegional([]);
    expect(r.numSucursales).toBe(0);
    expect(r.total).toBe('0');
  });

  it('una sucursal', () => {
    const r = consolidarRegional([SUCURSALES[0]]);
    expect(r.numSucursales).toBe(1);
    expect(r.porMedio.efectivo).toBe('100000');
  });
});
