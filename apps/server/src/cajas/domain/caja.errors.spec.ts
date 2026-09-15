import { describe, it, expect } from 'vitest';
import {
  CajaNoEncontradaError,
  SesionNoEncontradaError,
  ConsignacionNoEncontradaError,
  CajaYaAbiertaError,
  SesionYaCerradaError,
  SaldoInsuficienteError,
  AperturaExcedeAsignacionPuntoError,
  BaseExcedeLimiteCajaError,
  ConsignacionEstadoInvalidoError,
  CajaPadreNoEncontradaError,
  CodigoCajaDuplicadoError,
  AuxiliaresAbiertasError,
  MontoInvalidoError,
  CajeroYaAsignadoError,
  CajaNoAsignableError,
  CajaSinCajeroError,
  UsuarioNoAsignableError,
  DiferenciaNoEncontradaError,
  DiferenciaEstadoInvalidoError,
  BasePuntoInsuficienteError,
  ConfiguracionPuntoInvalidaError,
  SoDViolacionError,
  ReposicionNoEncontradaError,
  ReposicionEstadoInvalidoError,
  DiscrepanciaTransitoError,
  TopeMaximoEfectivoError,
} from './caja.errors.js';

describe('Caja domain errors', () => {
  it('CajaNoEncontradaError incluye id y statusCode 404', () => {
    const e = new CajaNoEncontradaError(7);
    expect(e).toBeInstanceOf(Error);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('7');
    expect(e.name).toBe('CajaNoEncontradaError');
  });

  it('SesionNoEncontradaError incluye id y statusCode 404', () => {
    const e = new SesionNoEncontradaError(3);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('3');
    expect(e.name).toBe('SesionNoEncontradaError');
  });

  it('ConsignacionNoEncontradaError incluye id y statusCode 404', () => {
    const e = new ConsignacionNoEncontradaError(9);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('9');
    expect(e.name).toBe('ConsignacionNoEncontradaError');
  });

  it('CajaYaAbiertaError incluye cajaId y statusCode 409', () => {
    const e = new CajaYaAbiertaError(2);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('2');
    expect(e.name).toBe('CajaYaAbiertaError');
  });

  it('SesionYaCerradaError incluye sesionId y statusCode 409', () => {
    const e = new SesionYaCerradaError(5);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('5');
    expect(e.name).toBe('SesionYaCerradaError');
  });

  it('SaldoInsuficienteError incluye saldo y monto y statusCode 422', () => {
    const e = new SaldoInsuficienteError('50000', '100000');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('50000');
    expect(e.message).toContain('100000');
    expect(e.name).toBe('SaldoInsuficienteError');
  });

  it('AperturaExcedeAsignacionPuntoError incluye monto, base y punto', () => {
    const e = new AperturaExcedeAsignacionPuntoError('5000000', '1000000', 'Bogotá Centro');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('Bogotá Centro');
    expect(e.message).toContain('5000000');
    expect(e.name).toBe('AperturaExcedeAsignacionPuntoError');
  });

  it('BaseExcedeLimiteCajaError incluye base, límite y código', () => {
    const e = new BaseExcedeLimiteCajaError('800000', '500000', 'POS-01');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('POS-01');
    expect(e.name).toBe('BaseExcedeLimiteCajaError');
  });

  it('ConsignacionEstadoInvalidoError incluye estado y statusCode 409', () => {
    const e = new ConsignacionEstadoInvalidoError('aprobada');
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('aprobada');
    expect(e.name).toBe('ConsignacionEstadoInvalidoError');
  });

  it('CajaPadreNoEncontradaError incluye id y statusCode 404', () => {
    const e = new CajaPadreNoEncontradaError(4);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('4');
    expect(e.name).toBe('CajaPadreNoEncontradaError');
  });

  it('CodigoCajaDuplicadoError incluye código y statusCode 409', () => {
    const e = new CodigoCajaDuplicadoError('POS-BOG-001');
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('POS-BOG-001');
    expect(e.name).toBe('CodigoCajaDuplicadoError');
  });

  it('AuxiliaresAbiertasError incluye cantidad y statusCode 409', () => {
    const e = new AuxiliaresAbiertasError(3);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('3');
    expect(e.name).toBe('AuxiliaresAbiertasError');
  });

  it('MontoInvalidoError incluye label y statusCode 422', () => {
    const e = new MontoInvalidoError('reposición');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('reposición');
    expect(e.name).toBe('MontoInvalidoError');
  });

  it('CajeroYaAsignadoError incluye cajeroId y statusCode 409', () => {
    const e = new CajeroYaAsignadoError(12);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('12');
    expect(e.name).toBe('CajeroYaAsignadoError');
  });

  it('CajaNoAsignableError incluye código, tipo y statusCode 422', () => {
    const e = new CajaNoAsignableError('POS-FUERTE', 'caja_fuerte');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('POS-FUERTE');
    expect(e.message).toContain('caja_fuerte');
    expect(e.name).toBe('CajaNoAsignableError');
  });

  it('CajaSinCajeroError incluye código y statusCode 422', () => {
    const e = new CajaSinCajeroError('POS-BOG-002');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('POS-BOG-002');
    expect(e.name).toBe('CajaSinCajeroError');
  });

  it('UsuarioNoAsignableError incluye mensaje y statusCode 422', () => {
    const e = new UsuarioNoAsignableError('El usuario no tiene el rol requerido');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('rol requerido');
    expect(e.name).toBe('UsuarioNoAsignableError');
  });

  it('DiferenciaNoEncontradaError incluye id y statusCode 404', () => {
    const e = new DiferenciaNoEncontradaError(8);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('8');
    expect(e.name).toBe('DiferenciaNoEncontradaError');
  });

  it('DiferenciaEstadoInvalidoError incluye estado y statusCode 409', () => {
    const e = new DiferenciaEstadoInvalidoError('resuelta');
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('resuelta');
    expect(e.name).toBe('DiferenciaEstadoInvalidoError');
  });

  it('BasePuntoInsuficienteError incluye totales y statusCode 422', () => {
    const e = new BasePuntoInsuficienteError('900000', '800000');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('900000');
    expect(e.name).toBe('BasePuntoInsuficienteError');
  });

  it('ConfiguracionPuntoInvalidaError incluye detalle y statusCode 422', () => {
    const e = new ConfiguracionPuntoInvalidaError('La base mínima es cero');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('La base mínima');
    expect(e.name).toBe('ConfiguracionPuntoInvalidaError');
  });

  it('SoDViolacionError tiene mensaje fijo y statusCode 403', () => {
    const e = new SoDViolacionError();
    expect(e.statusCode).toBe(403);
    expect(e.message).toContain('aprobador');
    expect(e.name).toBe('SoDViolacionError');
  });

  it('ReposicionNoEncontradaError acepta id numérico y string', () => {
    const en = new ReposicionNoEncontradaError(6);
    const es = new ReposicionNoEncontradaError('REF-001');
    expect(en.statusCode).toBe(404);
    expect(es.message).toContain('REF-001');
    expect(en.name).toBe('ReposicionNoEncontradaError');
  });

  it('ReposicionEstadoInvalidoError incluye estado y statusCode 409', () => {
    const e = new ReposicionEstadoInvalidoError('aprobada');
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('aprobada');
    expect(e.name).toBe('ReposicionEstadoInvalidoError');
  });

  it('DiscrepanciaTransitoError incluye emitido y recibido con statusCode 422', () => {
    const e = new DiscrepanciaTransitoError('500000', '480000');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('500000');
    expect(e.message).toContain('480000');
    expect(e.name).toBe('DiscrepanciaTransitoError');
  });

  it('TopeMaximoEfectivoError incluye saldo y tope con statusCode 422', () => {
    const e = new TopeMaximoEfectivoError('2000000', '1500000');
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('2000000');
    expect(e.message).toContain('1500000');
    expect(e.name).toBe('TopeMaximoEfectivoError');
  });
});
