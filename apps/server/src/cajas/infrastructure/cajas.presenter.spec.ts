import { describe, it, expect } from 'vitest';
import { CajasPresenter } from './cajas.presenter.js';
import type { StatusPunto, CardAuxiliar, PanelPunto } from '../domain/caja.entity.js';

const panel: PanelPunto = {
  baseGeneral:               '1000000',
  cajaGeneral:               '5000000.00',
  cajaFuerteGeneral:         '5000000.00',
  basePagos:                 '0',
  cajaPagos:                 '0.00',
  cajaFuertePagos:           '0.00',
  acumuladoMonedaCirculante: '0.00',
  tTransito:                 '0',
  baseDisponible:            '0.00',
  debeReset:                 false,
  horaReset:                 null,
};

function card(over: Partial<CardAuxiliar>): CardAuxiliar {
  return {
    cajaId: 1, sesionId: 1, codigo: 'POS-01', nombre: 'POS 1', tipo: 'pos',
    cajeroId: 8, cajeroFijoId: null, estado: 'abierta', saldoActual: '100000.00',
    baseDia: '500000', limiteAlerta: null, tTarget: null, deltaReposicion: null,
    ingresosSesion: '0.00', egresosSesion: '0.00',
    saldoPorMedioPago: {} as CardAuxiliar['saldoPorMedioPago'],
    girosCount: 0, girosValor: '0.00', alertas: [],
    ...over,
  } as CardAuxiliar;
}

const status: StatusPunto = {
  sucursalId: 1,
  cajaPadreId: 1,
  panel,
  cajas: [
    card({ cajaId: 10, codigo: 'CF-BOG-001', tipo: 'general', cajeroId: 8, saldoActual: '5000000.00' }),
    card({ cajaId: 11, codigo: 'POS-BOG-001-01', tipo: 'pos', cajeroId: 8 }),
    card({ cajaId: 12, codigo: 'POS-BOG-001-02', tipo: 'pos', cajeroId: 9 }),
  ],
};

describe('CajasPresenter.toStatusCajero', () => {
  it('no expone el efectivo de la bóveda ni las bases del punto', () => {
    const out = CajasPresenter.toStatusCajero(status, 8);
    expect(out.panel.cajaFuerteGeneral).toBeNull();
    expect(out.panel.cajaGeneral).toBeNull();
    expect(out.panel.baseGeneral).toBeNull();
    expect(out.panel.cajaPagos).toBeNull();
    expect(out.panel.cajaFuertePagos).toBeNull();
    expect(out.panel.acumuladoMonedaCirculante).toBeNull();
    expect(out.panel.tTransito).toBeNull();
  });

  it('conserva los campos operativos no monetarios del panel', () => {
    const out = CajasPresenter.toStatusCajero(status, 8);
    expect(out.panel.debeReset).toBe(false);
    expect(out.panel.horaReset).toBeNull();
    expect(out.sucursalId).toBe(1);
    expect(out.cajaPadreId).toBe(1);
  });

  it('excluye la caja general aunque el cajero figure asignado en ella', () => {
    const out = CajasPresenter.toStatusCajero(status, 8);
    expect(out.cajas.map(c => c.codigo)).toEqual(['POS-BOG-001-01']);
    expect(JSON.stringify(out)).not.toContain('5000000.00');
  });

  it('no devuelve las cajas de otros cajeros', () => {
    const out = CajasPresenter.toStatusCajero(status, 9);
    expect(out.cajas.map(c => c.codigo)).toEqual(['POS-BOG-001-02']);
  });

  it('toStatus sigue entregando el panel completo a los demás roles', () => {
    const out = CajasPresenter.toStatus(status);
    expect(out.panel.cajaFuerteGeneral).toBe('5000000.00');
    expect(out.cajas).toHaveLength(3);
  });
});
