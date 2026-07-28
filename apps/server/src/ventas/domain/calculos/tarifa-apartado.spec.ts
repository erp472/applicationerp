import { describe, it, expect } from 'vitest';
import { calcularTarifaApartado } from './tarifa-apartado.js';

const tarifas = [
  { sucursalId: 1, tamano: 'pequeno', tarifaAnual: '87500', vigente: true },
  { sucursalId: 1, tamano: 'mediano', tarifaAnual: '120000', vigente: true },
  { sucursalId: 2, tamano: 'pequeno', tarifaAnual: '95000', vigente: true },
  { sucursalId: 1, tamano: 'grande', tarifaAnual: '200000', vigente: false },
];

describe('calcularTarifaApartado', () => {
  it('encuentra tarifa vigente', () => {
    expect(calcularTarifaApartado(tarifas, 1, 'pequeno')).toBe('87500');
  });

  it('sucursal diferente', () => {
    expect(calcularTarifaApartado(tarifas, 2, 'pequeno')).toBe('95000');
  });

  it('tarifa no vigente lanza error', () => {
    expect(() => calcularTarifaApartado(tarifas, 1, 'grande')).toThrow('No se encontró tarifa vigente');
  });

  it('sin coincidencia lanza error', () => {
    expect(() => calcularTarifaApartado(tarifas, 99, 'pequeno')).toThrow('No se encontró tarifa vigente');
  });

  it('lista vacía lanza error', () => {
    expect(() => calcularTarifaApartado([], 1, 'pequeno')).toThrow();
  });
});
