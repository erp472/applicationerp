import { describe, it, expect } from 'vitest';
import { buildGuiaData, codigoCorto, truncarPalabra } from './guia-svg.generator.js';
import type { EnvioEntity } from './venta.entity.js';

const servicio = { codigo: 'NP-DOC-CERT', nombre: 'Corr. No Prioritaria - Doc. con Certi.' };
const sucursal = { codigo: 'SUC-BOG-002', nombre: 'Bogotá Norte' };

function envio(over: Partial<EnvioEntity> = {}): EnvioEntity {
  return {
    numeroGuia:     'RA00000010',
    codigoTracking: 'RA000000104CO',
    createdAt:      new Date('2026-08-21T10:00:00Z'),
    contenido:      'DOCUMENTOS COMERCIALES',
    observaciones:  'FRÁGIL',
    valorEstampillas: 0, valorSeguro: 0, valorCertificacion: 1800,
    pesoFisicoKg: 2.5, pesoTarificadoKg: 2.5, valorServicio: 7800, valorTotal: 9600,
    ...over,
  } as EnvioEntity;
}

describe('buildGuiaData', () => {
  it('lleva "dice contener" y observaciones del envío a la guía', () => {
    const d = buildGuiaData(envio(), servicio, sucursal);
    expect(d.diceContener).toBe('DOCUMENTOS COMERCIALES');
    expect(d.observaciones).toBe('FRÁGIL');
  });

  it('parte el código S10 en las dos líneas del código de barras', () => {
    const d = buildGuiaData(envio(), servicio, sucursal);
    expect(d.barcodeText1).toBe('*RA00000010');
    expect(d.barcodeText2).toBe('4CO*');
    expect(d.barcodeLineal).toBe('RA000000104CO');
  });

  it('cae al número de guía cuando el servicio no tiene rastreo S10', () => {
    const d = buildGuiaData(envio({ codigoTracking: null, numeroGuia: 'GU00000010' }), servicio, sucursal);
    expect(d.barcodeLineal).toBe('GU00000010');
  });

  it('imprime la fecha estimada de entrega cuando se conoce', () => {
    const d = buildGuiaData(envio(), servicio, sucursal, new Date('2026-08-29T10:00:00Z'));
    expect(d.fechaApproxEntrega).toBe('29/08/2026');
    expect(d.fechaEntrega).toBe('29/08/2026');
    expect(d.fechaPlaceholder2).toBe('29/08/2026');
  });

  it('usa el código del servicio, que cabe entero en los slots cortos', () => {
    const d = buildGuiaData(envio(), servicio, sucursal);
    expect(d.codigoOperativo).toBe('NP-DOC-CERT');
    expect(d.lateral_envio).toBe('NP-DOC-CERT');
  });
});

describe('codigoCorto', () => {
  it('conserva el tramo que identifica el punto', () => {
    expect(codigoCorto('SUC-BOG-002')).toBe('002');
  });

  it('deja intacto un código sin separadores', () => {
    expect(codigoCorto('7419')).toBe('7419');
  });
});

describe('truncarPalabra', () => {
  it('no toca lo que ya cabe', () => {
    expect(truncarPalabra('Bogotá Norte', 18)).toBe('Bogotá Norte');
  });

  it('corta en el último espacio en vez de partir la palabra', () => {
    expect(truncarPalabra('Chapinero Centro Alto', 15)).toBe('Chapinero');
  });

  it('corta duro cuando es una sola palabra larga', () => {
    expect(truncarPalabra('Barranquillaaaaaa', 8)).toBe('Barranqu');
  });
});
