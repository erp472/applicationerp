import { describe, it, expect } from 'vitest';
import {
  ServicioDomainError,
  ServicioNotFoundError,
  ServicioCodigoDuplicadoError,
  ServicioFactorVolumetricoRequeridoError,
  ServicioPesoExcedidoError,
  ServicioCampoNegativoError,
  ServicioEstampillaInconsistenteError,
  ServicioSucursalNoEncontradaError,
  ServicioYaAsignadoError,
  ServicioNoAsignadoError,
  ServicioTarifaNotFoundError,
} from './servicio.errors.js';

describe('Servicio domain errors', () => {
  it('ServicioNotFoundError incluye id y statusCode 404', () => {
    const e = new ServicioNotFoundError(8);
    expect(e).toBeInstanceOf(ServicioDomainError);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('8');
  });

  it('ServicioCodigoDuplicadoError incluye código y statusCode 409', () => {
    const e = new ServicioCodigoDuplicadoError('NP-DOC-NOR');
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('NP-DOC-NOR');
  });

  it('ServicioFactorVolumetricoRequeridoError tiene mensaje fijo y statusCode 400', () => {
    const e = new ServicioFactorVolumetricoRequeridoError();
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('factor_volumetrico');
  });

  it('ServicioPesoExcedidoError incluye pesos y statusCode 400', () => {
    const e = new ServicioPesoExcedidoError(35, 30);
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('35');
    expect(e.message).toContain('30');
  });

  it('ServicioCampoNegativoError incluye campo y statusCode 400', () => {
    const e = new ServicioCampoNegativoError('precio_base');
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('precio_base');
  });

  it('ServicioEstampillaInconsistenteError tiene mensaje fijo y statusCode 400', () => {
    const e = new ServicioEstampillaInconsistenteError();
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('estampilla');
  });

  it('ServicioSucursalNoEncontradaError incluye sucursalId y statusCode 400', () => {
    const e = new ServicioSucursalNoEncontradaError(3);
    expect(e.statusCode).toBe(400);
    expect(e.message).toContain('3');
  });

  it('ServicioYaAsignadoError incluye servicioId y sucursalId con statusCode 409', () => {
    const e = new ServicioYaAsignadoError(2, 5);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('2');
    expect(e.message).toContain('5');
  });

  it('ServicioNoAsignadoError incluye servicioId y sucursalId con statusCode 404', () => {
    const e = new ServicioNoAsignadoError(6, 9);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('6');
    expect(e.message).toContain('9');
  });

  it('ServicioTarifaNotFoundError incluye tarifaId y statusCode 404', () => {
    const e = new ServicioTarifaNotFoundError(12);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('12');
  });
});
