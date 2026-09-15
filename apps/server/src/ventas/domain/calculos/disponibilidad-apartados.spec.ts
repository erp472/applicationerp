import { describe, it, expect } from 'vitest';
import { calcularDisponibilidadApartados } from './disponibilidad-apartados.js';

const apartados = [
  { apartadoId: 1, estado: 'disponible', tamano: 'pequeno', sucursalId: 1 },
  { apartadoId: 2, estado: 'ocupado', tamano: 'pequeno', sucursalId: 1 },
  { apartadoId: 3, estado: 'disponible', tamano: 'mediano', sucursalId: 1 },
  { apartadoId: 4, estado: 'disponible', tamano: 'pequeno', sucursalId: 2 },
  { apartadoId: 5, estado: 'disponible', tamano: 'grande', sucursalId: 1 },
];

describe('calcularDisponibilidadApartados', () => {
  it('sin filtro de tamaño retorna todos disponibles de la sucursal', () => {
    const result = calcularDisponibilidadApartados(apartados, 1);
    expect(result.totalDisponibles).toBe(3);
    const ids = result.lista.map(a => a.apartadoId);
    expect(ids).toContain(1);
    expect(ids).toContain(3);
    expect(ids).toContain(5);
    expect(ids).not.toContain(2);
  });

  it('con filtro de tamaño', () => {
    const result = calcularDisponibilidadApartados(apartados, 1, 'pequeno');
    expect(result.totalDisponibles).toBe(1);
    expect(result.lista[0].apartadoId).toBe(1);
  });

  it('otra sucursal', () => {
    const result = calcularDisponibilidadApartados(apartados, 2);
    expect(result.totalDisponibles).toBe(1);
    expect(result.lista[0].apartadoId).toBe(4);
  });

  it('sin resultados retorna lista vacía', () => {
    const result = calcularDisponibilidadApartados(apartados, 99);
    expect(result.totalDisponibles).toBe(0);
    expect(result.lista).toHaveLength(0);
  });

  it('lista de apartados vacía', () => {
    const result = calcularDisponibilidadApartados([], 1);
    expect(result.totalDisponibles).toBe(0);
  });
});
