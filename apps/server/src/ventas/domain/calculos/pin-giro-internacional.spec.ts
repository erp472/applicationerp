import { describe, it, expect } from 'vitest';
import { validarPinGiroInternacional, type DatosGiro } from './pin-giro-internacional.js';

const DATOS_MG: DatosGiro = {
  pin: '123456',
  nombreBeneficiario: 'Maria Lopez',
  cedulaBeneficiario: '10203040',
  fechaNacimiento: '1985-03-20',
};

describe('validarPinGiroInternacional', () => {
  it('válido moneygram no lanza', () => {
    expect(() =>
      validarPinGiroInternacional('123456', 'moneygram', 'Maria Lopez', '10203040', '1985-03-20', DATOS_MG),
    ).not.toThrow();
  });

  it('válido ria 11 dígitos', () => {
    const datos: DatosGiro = {
      pin: '12345678901',
      nombreBeneficiario: 'Carlos Ruiz',
      cedulaBeneficiario: '50607080',
      fechaNacimiento: '1990-07-10',
    };
    expect(() =>
      validarPinGiroInternacional('12345678901', 'ria', 'Carlos Ruiz', '50607080', '1990-07-10', datos),
    ).not.toThrow();
  });

  it('operador desconocido lanza error', () => {
    expect(() =>
      validarPinGiroInternacional('123456', 'desconocido', 'Maria Lopez', '10203040', '1985-03-20', DATOS_MG),
    ).toThrow('Operador desconocido');
  });

  it('longitud incorrecta lanza error', () => {
    expect(() =>
      validarPinGiroInternacional('12345', 'moneygram', 'Maria Lopez', '10203040', '1985-03-20', DATOS_MG),
    ).toThrow('PIN inválido');
  });

  it('PIN no numérico lanza error', () => {
    expect(() =>
      validarPinGiroInternacional('ABCDEF', 'moneygram', 'Maria Lopez', '10203040', '1985-03-20', DATOS_MG),
    ).toThrow('PIN inválido');
  });

  it('PIN incorrecto lanza error', () => {
    expect(() =>
      validarPinGiroInternacional('999999', 'moneygram', 'Maria Lopez', '10203040', '1985-03-20', DATOS_MG),
    ).toThrow('PIN incorrecto');
  });

  it('nombre no coincide lanza error', () => {
    expect(() =>
      validarPinGiroInternacional('123456', 'moneygram', 'Pedro Gomez', '10203040', '1985-03-20', DATOS_MG),
    ).toThrow('Nombre del beneficiario');
  });

  it('cédula no coincide lanza error', () => {
    expect(() =>
      validarPinGiroInternacional('123456', 'moneygram', 'Maria Lopez', '99999999', '1985-03-20', DATOS_MG),
    ).toThrow('Cédula del beneficiario');
  });

  it('fecha no coincide lanza error', () => {
    expect(() =>
      validarPinGiroInternacional('123456', 'moneygram', 'Maria Lopez', '10203040', '2000-01-01', DATOS_MG),
    ).toThrow('Fecha de nacimiento');
  });
});
