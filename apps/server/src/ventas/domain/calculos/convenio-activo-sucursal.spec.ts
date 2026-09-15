import { describe, it, expect } from 'vitest';
import { verificarConvenioActivoSucursal, type ConvenioSucursal } from './convenio-activo-sucursal.js';

const CONVENIOS: ConvenioSucursal[] = [
  { convenioId: 1, sucursalId: 10, activo: true },
  { convenioId: 1, sucursalId: 20, activo: false },
  { convenioId: 2, sucursalId: 10, activo: true },
  { convenioId: 3, sucursalId: 10, activo: false },
];

describe('verificarConvenioActivoSucursal', () => {
  it('convenio activo retorna true', () => {
    expect(verificarConvenioActivoSucursal(CONVENIOS, 1, 10)).toBe(true);
  });

  it('convenio inactivo retorna false', () => {
    expect(verificarConvenioActivoSucursal(CONVENIOS, 1, 20)).toBe(false);
  });

  it('inactivo explícito', () => {
    expect(verificarConvenioActivoSucursal(CONVENIOS, 3, 10)).toBe(false);
  });

  it('convenio inexistente retorna false', () => {
    expect(verificarConvenioActivoSucursal(CONVENIOS, 99, 10)).toBe(false);
  });

  it('sucursal inexistente retorna false', () => {
    expect(verificarConvenioActivoSucursal(CONVENIOS, 1, 99)).toBe(false);
  });

  it('lista vacía retorna false', () => {
    expect(verificarConvenioActivoSucursal([], 1, 10)).toBe(false);
  });

  it('segundo convenio activo', () => {
    expect(verificarConvenioActivoSucursal(CONVENIOS, 2, 10)).toBe(true);
  });
});
