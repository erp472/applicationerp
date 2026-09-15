import { describe, it, expect } from 'vitest';
import { calcularCertificacionCorreo } from './calcular-certificacion-correo.js';

describe('calcularCertificacionCorreo', () => {
  it('retorna la tarifa cuando está definida', () => {
    expect(calcularCertificacionCorreo(1800)).toBe(1800);
  });

  it('tarifa cero retorna cero', () => {
    expect(calcularCertificacionCorreo(0)).toBe(0);
  });

  it('null retorna cero — servicio sin certificación', () => {
    expect(calcularCertificacionCorreo(null)).toBe(0);
  });

  it('undefined retorna cero — campo no configurado', () => {
    expect(calcularCertificacionCorreo(undefined)).toBe(0);
  });

  it('tarifa decimal', () => {
    expect(calcularCertificacionCorreo(2500.5)).toBe(2500.5);
  });
});
