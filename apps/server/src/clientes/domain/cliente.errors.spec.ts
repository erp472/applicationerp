import { describe, it, expect } from 'vitest';
import {
  ClienteNoEncontradoError,
  ClienteYaExisteError,
  TipoClienteNoEncontradoError,
  TipoClienteCodigoDuplicadoError,
} from './cliente.errors.js';

describe('Cliente domain errors', () => {
  it('ClienteNoEncontradoError con id numérico', () => {
    const e = new ClienteNoEncontradoError(5);
    expect(e).toBeInstanceOf(Error);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('5');
    expect(e.name).toBe('ClienteNoEncontradoError');
  });

  it('ClienteNoEncontradoError con id string', () => {
    const e = new ClienteNoEncontradoError('CC-123');
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('CC-123');
  });

  it('ClienteYaExisteError incluye tipo y número de documento', () => {
    const e = new ClienteYaExisteError('NIT', '900123456');
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('NIT');
    expect(e.message).toContain('900123456');
    expect(e.name).toBe('ClienteYaExisteError');
  });

  it('TipoClienteNoEncontradoError incluye id y statusCode 404', () => {
    const e = new TipoClienteNoEncontradoError(3);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('3');
    expect(e.name).toBe('TipoClienteNoEncontradoError');
  });

  it('TipoClienteCodigoDuplicadoError incluye código y statusCode 409', () => {
    const e = new TipoClienteCodigoDuplicadoError('EMPRESA');
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('EMPRESA');
    expect(e.name).toBe('TipoClienteCodigoDuplicadoError');
  });
});
