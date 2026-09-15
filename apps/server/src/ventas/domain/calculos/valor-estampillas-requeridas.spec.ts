import { describe, it, expect } from 'vitest';
import {
  calcularValorEstampillasRequeridas,
  type DenominacionStock,
} from './valor-estampillas-requeridas.js';

const DENOMINACIONES: DenominacionStock[] = [
  { denominacion: '5000', stock: 10 },
  { denominacion: '1000', stock: 20 },
  { denominacion: '500', stock: 20 },
  { denominacion: '100', stock: 50 },
];

describe('calcularValorEstampillasRequeridas', () => {
  it('no requerida — retorna cero', () => {
    const r = calcularValorEstampillasRequeridas(false, '15000', DENOMINACIONES);
    expect(r.valorEstampillas).toBe('0');
    expect(r.seleccion).toHaveLength(0);
  });

  it('cobertura exacta', () => {
    const r = calcularValorEstampillasRequeridas(true, '15000', DENOMINACIONES);
    expect(r.valorEstampillas).toBe('15000');
    const total = r.seleccion.reduce(
      (acc, d) => acc + Number(d.denominacion) * d.cantidad,
      0,
    );
    expect(total).toBe(15000);
  });

  it('combinación mixta 6500', () => {
    // 5000*1 + 1000*1 + 500*1 = 6500
    const r = calcularValorEstampillasRequeridas(true, '6500', DENOMINACIONES);
    expect(r.valorEstampillas).toBe('6500');
    const total = r.seleccion.reduce(
      (acc, d) => acc + Number(d.denominacion) * d.cantidad,
      0,
    );
    expect(total).toBe(6500);
  });

  it('sin stock suficiente lanza error', () => {
    const sinStock: DenominacionStock[] = [{ denominacion: '1000', stock: 0 }];
    expect(() =>
      calcularValorEstampillasRequeridas(true, '500', sinStock),
    ).toThrow('No hay combinación');
  });

  it('monto cero retorna vacío', () => {
    const r = calcularValorEstampillasRequeridas(true, '0', DENOMINACIONES);
    expect(r.valorEstampillas).toBe('0');
    expect(r.seleccion).toHaveLength(0);
  });
});
