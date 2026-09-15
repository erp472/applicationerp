import { describe, it, expect } from 'vitest';
import { calcularTarifaNacional, type TarifaServicioRow } from './tarifa-nacional.js';

const TARIFAS: TarifaServicioRow[] = [
  {
    servicioId: 1,
    ciudadDestino: 'Bogota',
    pesoMinKg: '0',
    pesoMaxKg: '5',
    tipoClienteId: null,
    tarifaBase: '15000',
    tarifaKgAdicional: '2000',
    vigente: true,
  },
  {
    servicioId: 1,
    ciudadDestino: 'Bogota',
    pesoMinKg: '0',
    pesoMaxKg: '5',
    tipoClienteId: 3,
    tarifaBase: '12000',
    tarifaKgAdicional: '1500',
    vigente: true,
  },
  {
    servicioId: 1,
    ciudadDestino: 'Medellin',
    pesoMinKg: '0',
    pesoMaxKg: '5',
    tipoClienteId: null,
    tarifaBase: '18000',
    tarifaKgAdicional: '2500',
    vigente: true,
  },
  {
    servicioId: 2,
    ciudadDestino: 'Bogota',
    pesoMinKg: '0',
    pesoMaxKg: '10',
    tipoClienteId: null,
    tarifaBase: '20000',
    tarifaKgAdicional: '3000',
    vigente: true,
  },
];

describe('calcularTarifaNacional', () => {
  it('tarifa retail', () => {
    const r = calcularTarifaNacional(TARIFAS, 1, 'Bogota', 3, null);
    expect(r.tarifaBase).toBe('15000');
    expect(r.tarifaKgAdicional).toBe('2000');
    expect(r.pesoMaxKgTramo).toBe(5);
  });

  it('cliente específico tiene prioridad sobre retail', () => {
    const r = calcularTarifaNacional(TARIFAS, 1, 'Bogota', 3, 3);
    expect(r.tarifaBase).toBe('12000');
    expect(r.tarifaKgAdicional).toBe('1500');
  });

  it('cliente sin tarifa específica cae a retail', () => {
    const r = calcularTarifaNacional(TARIFAS, 1, 'Bogota', 3, 99);
    expect(r.tarifaBase).toBe('15000');
  });

  it('ciudad diferente', () => {
    const r = calcularTarifaNacional(TARIFAS, 1, 'Medellin', 2, null);
    expect(r.tarifaBase).toBe('18000');
  });

  it('servicio inexistente lanza error', () => {
    expect(() => calcularTarifaNacional(TARIFAS, 99, 'Bogota', 3, null)).toThrow(
      'No se encontró tarifa',
    );
  });

  it('peso fuera de rango lanza error', () => {
    expect(() => calcularTarifaNacional(TARIFAS, 1, 'Bogota', 100, null)).toThrow(
      'No se encontró tarifa',
    );
  });

  it('lista vacía lanza error', () => {
    expect(() => calcularTarifaNacional([], 1, 'Bogota', 3, null)).toThrow();
  });
});
