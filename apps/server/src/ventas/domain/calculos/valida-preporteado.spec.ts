import { describe, it, expect } from 'vitest';
import { validarPermitePreporteado, type PermisoPreporteado } from './valida-preporteado.js';

const PERMISOS: PermisoPreporteado[] = [
  { servicioId: 1, permite: true },
  { servicioId: 2, permite: false },
  { servicioId: 3, permite: true },
];

describe('validarPermitePreporteado', () => {
  it('servicio permitido retorna true', () => {
    expect(validarPermitePreporteado(PERMISOS, 1)).toBe(true);
  });

  it('servicio no permitido retorna false', () => {
    expect(validarPermitePreporteado(PERMISOS, 2)).toBe(false);
  });

  it('servicio inexistente retorna false', () => {
    expect(validarPermitePreporteado(PERMISOS, 99)).toBe(false);
  });

  it('lista vacía retorna false', () => {
    expect(validarPermitePreporteado([], 1)).toBe(false);
  });
});
