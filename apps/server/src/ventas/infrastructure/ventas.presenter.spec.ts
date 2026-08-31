import { describe, it, expect } from 'vitest';
import { VentasPresenter } from './ventas.presenter.js';
import type { GuiaContexto } from './ventas.presenter.js';
import type { EnvioEntity } from '../domain/venta.entity.js';

const ctx: GuiaContexto = {
  servicio:             { codigo: 'NP-DOC-CERT', nombre: 'Corr. No Prioritaria - Doc. con Certi.' },
  sucursal:             { codigo: 'SUC-BOG-002', nombre: 'Bogotá Norte' },
  fechaEntregaEstimada: '2026-08-29T10:00:00.000Z',
};

function envio(over: Partial<EnvioEntity> = {}): EnvioEntity {
  return {
    id:             10,
    numeroGuia:     'RA00000010',
    codigoTracking: 'RA000000104CO',
    tipo:           'nacional',
    createdAt:      new Date('2026-08-21T10:00:00Z'),
    contenido:      'DOCUMENTOS COMERCIALES',
    observaciones:  'FRÁGIL',
    destinatarioPais: 'CO',
    ...over,
  } as EnvioEntity;
}

describe('VentasPresenter.toGuia', () => {
  it('lleva el servicio y el punto de admisión a la guía en pantalla', () => {
    const g = VentasPresenter.toGuia(envio(), ctx);
    expect(g.tipoServicio).toBe('Corr. No Prioritaria - Doc. con Certi.');
    expect(g.codigoServicio).toBe('NP-DOC-CERT');
    expect(g.centroOperativo).toBe('Bogotá Norte');
    expect(g.centroOperativoCodigo).toBe('SUC-BOG-002');
    expect(g.fechaEntregaEstimada).toBe('2026-08-29T10:00:00.000Z');
  });

  it('lleva "dice contener" y observaciones', () => {
    const g = VentasPresenter.toGuia(envio(), ctx);
    expect(g.contenido).toBe('DOCUMENTOS COMERCIALES');
    expect(g.observaciones).toBe('FRÁGIL');
  });

  it('usa el código S10 como código de barras', () => {
    expect(VentasPresenter.toGuia(envio(), ctx).codigoBarras).toBe('RA000000104CO');
  });

  it('cae al número de guía cuando el servicio no tiene rastreo S10', () => {
    const g = VentasPresenter.toGuia(envio({ codigoTracking: null, numeroGuia: 'GU00000010' }), ctx);
    expect(g.codigoBarras).toBe('GU00000010');
  });
});
