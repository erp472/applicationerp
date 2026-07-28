import { describe, it, expect } from 'vitest';
import { calcularSucursalesActivas } from './sucursales-activas.js';

describe('calcularSucursalesActivas', () => {
  it('conteo correcto', () => {
    const r = calcularSucursalesActivas([
      { sucursalId: 1, tieneSesionAbiertaHoy: true },
      { sucursalId: 2, tieneSesionAbiertaHoy: false },
      { sucursalId: 3, tieneSesionAbiertaHoy: true },
      { sucursalId: 4, tieneSesionAbiertaHoy: false },
    ]);
    expect(r.total).toBe(4);
    expect(r.activas).toBe(2);
    expect(r.inactivas).toBe(2);
    expect(r.pctActivas).toBe(50.0);
  });

  it('todas activas', () => {
    const r = calcularSucursalesActivas([
      { sucursalId: 1, tieneSesionAbiertaHoy: true },
      { sucursalId: 2, tieneSesionAbiertaHoy: true },
    ]);
    expect(r.activas).toBe(2);
    expect(r.inactivas).toBe(0);
    expect(r.pctActivas).toBe(100.0);
  });

  it('lista vacía', () => {
    const r = calcularSucursalesActivas([]);
    expect(r.total).toBe(0);
    expect(r.activas).toBe(0);
    expect(r.pctActivas).toBe(0.0);
  });

  it('ninguna activa', () => {
    const r = calcularSucursalesActivas([
      { sucursalId: 1, tieneSesionAbiertaHoy: false },
      { sucursalId: 2, tieneSesionAbiertaHoy: false },
    ]);
    expect(r.activas).toBe(0);
    expect(r.inactivas).toBe(2);
    expect(r.pctActivas).toBe(0.0);
  });
});
