import { describe, it, expect } from 'vitest';
import {
  esCajaOperativa, puedeSupervisarPunto, puedeSerCajeroDeCaja,
  resolverCajeroDeApertura, requiereCajero, puedeOperarSesion,
} from './asignacion-caja.js';

describe('puedeOperarSesion', () => {
  it('acepta al cajero al que se asignó la sesión', () => {
    expect(puedeOperarSesion({ cajeroAsignadoId: 55, usuarioAperturaId: 8 }, 55)).toBe(true);
  });

  // El caso real: el supervisor 8 abrió la caja del cajero 55 y el cajero 51 vendió $98.809 en ella.
  it('rechaza a cualquier otro, incluido quien abrió la sesión', () => {
    expect(puedeOperarSesion({ cajeroAsignadoId: 55, usuarioAperturaId: 8 }, 51)).toBe(false);
    expect(puedeOperarSesion({ cajeroAsignadoId: 55, usuarioAperturaId: 8 }, 8)).toBe(false);
  });

  it('deja operar a quien abrió las sesiones viejas que nacieron sin cajero', () => {
    expect(puedeOperarSesion({ cajeroAsignadoId: null, usuarioAperturaId: 8 }, 8)).toBe(true);
    expect(puedeOperarSesion({ cajeroAsignadoId: null, usuarioAperturaId: 8 }, 51)).toBe(false);
  });
});

describe('resolverCajeroDeApertura', () => {
  it('respeta el cajero que manda la apertura', () => {
    expect(resolverCajeroDeApertura('pos', 51, 55)).toBe(51);
  });

  // El caso real: la apertura no mandó cajero y la caja estaba asignada al 55,
  // pero la sesión nacía sin dueño y terminó vendiendo el 51.
  it('hereda el cajero fijo cuando la apertura no manda ninguno', () => {
    expect(resolverCajeroDeApertura('pos', undefined, 55)).toBe(55);
    expect(resolverCajeroDeApertura('pos', null, 55)).toBe(55);
  });

  it('deja sin cajero a los bolsillos, que no abren turno', () => {
    expect(resolverCajeroDeApertura('general', 51, 55)).toBeNull();
    expect(resolverCajeroDeApertura('menor', 51, 55)).toBeNull();
  });

  it('devuelve null cuando no hay de dónde sacarlo', () => {
    expect(resolverCajeroDeApertura('pos', null, null)).toBeNull();
  });
});

describe('requiereCajero', () => {
  it('exige cajero a la caja operativa que quedó sin resolver', () => {
    expect(requiereCajero('pos', null)).toBe(true);
    expect(requiereCajero('pagos', null)).toBe(true);
  });

  it('no exige nada si ya hay cajero', () => {
    expect(requiereCajero('pos', 55)).toBe(false);
  });

  it('no exige cajero a los bolsillos', () => {
    expect(requiereCajero('general', null)).toBe(false);
    expect(requiereCajero('menor', null)).toBe(false);
  });
});

describe('esCajaOperativa', () => {
  it('acepta la caja POS porque abre turno y vende', () => {
    expect(esCajaOperativa('pos')).toBe(true);
  });

  it('acepta la caja de pagos porque presta servicios al público', () => {
    expect(esCajaOperativa('pagos')).toBe(true);
  });

  it('rechaza la Caja Fuerte: es la bóveda de la caja principal', () => {
    expect(esCajaOperativa('general')).toBe(false);
  });

  it('rechaza la Caja Menor: es el fondo de gastos del punto', () => {
    expect(esCajaOperativa('menor')).toBe(false);
  });
});

describe('puedeSupervisarPunto', () => {
  it('acepta al supervisor regional destacado en la sucursal del punto', () => {
    expect(puedeSupervisarPunto({ rol: 'SUPERVISOR_REGIONAL', sucursalId: 3 }, 3)).toBe(true);
  });

  it('rechaza al administrador de sistema: aprobaría y ejecutaría a la vez', () => {
    expect(puedeSupervisarPunto({ rol: 'ADMIN_SISTEMA', sucursalId: 3 }, 3)).toBe(false);
  });

  it('rechaza al supervisor de otra sucursal', () => {
    expect(puedeSupervisarPunto({ rol: 'SUPERVISOR_REGIONAL', sucursalId: 1 }, 3)).toBe(false);
  });

  it('rechaza al usuario sin sucursal asignada', () => {
    expect(puedeSupervisarPunto({ rol: 'SUPERVISOR_REGIONAL', sucursalId: null }, 3)).toBe(false);
  });
});

describe('puedeSerCajeroDeCaja', () => {
  it('acepta al cajero de la misma sucursal', () => {
    expect(puedeSerCajeroDeCaja({ rol: 'CAJERO', sucursalId: 1 }, 1)).toBe(true);
  });

  it('rechaza al supervisor: su rol es custodiar, no vender', () => {
    expect(puedeSerCajeroDeCaja({ rol: 'SUPERVISOR_REGIONAL', sucursalId: 1 }, 1)).toBe(false);
  });

  it('rechaza al cajero de otra sucursal', () => {
    expect(puedeSerCajeroDeCaja({ rol: 'CAJERO', sucursalId: 2 }, 1)).toBe(false);
  });
});
