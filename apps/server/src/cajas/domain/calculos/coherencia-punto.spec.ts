import { describe, it, expect } from 'vitest';
import { diagnosticarPunto, regresionesConfiguracion, type CajaConfigurada } from './coherencia-punto.js';

const fuerte = (baseDia: string): CajaConfigurada =>
  ({ codigo: 'CF-BOG-001', tipo: 'general', baseDia, activo: true });
const pos = (codigo: string, baseDia: string, activo = true): CajaConfigurada =>
  ({ codigo, tipo: 'pos', baseDia, activo });
const menor = (baseDia: string): CajaConfigurada =>
  ({ codigo: 'CM-BOG-001', tipo: 'menor', baseDia, activo: true });

describe('diagnosticarPunto', () => {
  it('no reporta problemas cuando el reparto cabe en la Caja Fuerte', () => {
    const d = diagnosticarPunto('1000000', 53, [fuerte('1000000'), pos('POS-01', '500000')]);
    expect(d.problemas).toHaveLength(0);
  });

  it('detecta la Caja Fuerte configurada por encima de la base del punto', () => {
    const d = diagnosticarPunto('1000000', 53, [fuerte('5000000')]);
    expect(d.problemas).toContain('base_fuerte_excede_punto');
    expect(d.baseFuerte).toBe('5000000');
  });

  it('detecta que lo repartido supera el fondo de la Caja Fuerte', () => {
    const d = diagnosticarPunto('1000000', 53, [
      fuerte('1000000'), pos('POS-01', '500000'), pos('POS-02', '500000'), pos('POS-03', '500000'),
    ]);
    expect(d.problemas).toContain('reparto_excede_fuerte');
    expect(d.sumaRepartida).toBe('1500000.00');
  });

  // El hueco que motivó el cambio: la base del punto alcanzaba de sobra, pero la Fuerte
  // custodia menos de lo que las cajas tienen asignado. Antes se reportaba sano.
  it('detecta el reparto excedido aunque quepa en la base del punto', () => {
    const d = diagnosticarPunto('5000000', 53, [fuerte('1000000'), pos('POS-01', '3200000')]);
    expect(d.problemas).toEqual(['reparto_excede_fuerte']);
  });

  it('no cuenta la Caja Fuerte dentro de lo repartido', () => {
    const d = diagnosticarPunto('1000000', 53, [fuerte('1000000'), pos('POS-01', '400000')]);
    expect(d.sumaRepartida).toBe('400000.00');
    expect(d.problemas).toHaveLength(0);
  });

  it('separa la Caja Menor de las cajas operativas', () => {
    const d = diagnosticarPunto('1000000', 53, [
      fuerte('1000000'), pos('POS-01', '400000'), menor('200000'),
    ]);
    expect(d.sumaOperativas).toBe('400000.00');
    expect(d.baseMenor).toBe('200000.00');
    expect(d.sumaRepartida).toBe('600000.00');
  });

  it('ignora las cajas inactivas', () => {
    const d = diagnosticarPunto('1000000', 53, [
      fuerte('1000000'), pos('POS-01', '900000'), pos('POS-02', '900000', false),
    ]);
    expect(d.sumaRepartida).toBe('900000.00');
    expect(d.problemas).toHaveLength(0);
  });

  it('reporta el punto sin supervisor asignado', () => {
    const d = diagnosticarPunto('1000000', null, [fuerte('1000000')]);
    expect(d.problemas).toContain('sin_supervisor');
  });

  it('reporta el punto sin Caja Fuerte sin duplicar el exceso de reparto', () => {
    const d = diagnosticarPunto('1000000', 53, [pos('POS-01', '100000')]);
    expect(d.problemas).toEqual(['sin_caja_fuerte']);
    expect(d.baseFuerte).toBe('0');
  });

  it('calcula lo que queda en la Fuerte por repartir', () => {
    const d = diagnosticarPunto('1000000', 53, [fuerte('1000000'), pos('POS-01', '300000')]);
    expect(d.disponible).toBe('700000.00');
  });

  it('no devuelve disponible negativo cuando ya hay sobreasignación', () => {
    const d = diagnosticarPunto('1000000', 53, [fuerte('1000000'), pos('POS-01', '3200000')]);
    expect(d.disponible).toBe('0.00');
  });

  it('acumula varios problemas a la vez', () => {
    const d = diagnosticarPunto('1000000', null, [fuerte('5000000'), pos('POS-01', '5200000')]);
    expect(d.problemas).toEqual(expect.arrayContaining([
      'sin_supervisor', 'base_fuerte_excede_punto', 'reparto_excede_fuerte',
    ]));
  });
});

describe('regresionesConfiguracion', () => {
  // Punto Bogotá Centro tal como estaba: la Fuerte excede la base y el reparto excede la Fuerte
  const roto = () => diagnosticarPunto('1000000', 53, [
    fuerte('5000000'), pos('POS-01', '500000'), pos('POS-02', '500000'), pos('PAG-01', '6000000'),
  ]);

  it('permite bajar la Caja Fuerte aunque el reparto siga excedido', () => {
    const despues = diagnosticarPunto('1000000', 53, [
      fuerte('4000000'), pos('POS-01', '500000'), pos('POS-02', '500000'), pos('PAG-01', '5000000'),
    ]);
    expect(regresionesConfiguracion(roto(), despues)).toEqual([]);
  });

  it('permite bajar una caja aunque la Caja Fuerte siga excedida', () => {
    const despues = diagnosticarPunto('1000000', 53, [
      fuerte('5000000'), pos('POS-01', '500000'), pos('POS-02', '500000'), pos('PAG-01', '0'),
    ]);
    expect(regresionesConfiguracion(roto(), despues)).toEqual([]);
  });

  it('rechaza empeorar un problema que ya existía', () => {
    const despues = diagnosticarPunto('1000000', 53, [
      fuerte('9000000'), pos('POS-01', '500000'), pos('POS-02', '500000'), pos('PAG-01', '6000000'),
    ]);
    expect(regresionesConfiguracion(roto(), despues)).toEqual(['base_fuerte_excede_punto']);
  });

  it('rechaza un problema nuevo en un punto que estaba sano', () => {
    const antes   = diagnosticarPunto('1000000', 53, [fuerte('1000000'), pos('POS-01', '500000')]);
    const despues = diagnosticarPunto('1000000', 53, [fuerte('1000000'), pos('POS-01', '1500000')]);
    expect(regresionesConfiguracion(antes, despues)).toEqual(['reparto_excede_fuerte']);
  });
});
