import { describe, it, expect } from 'vitest';
import {
  LoteNoEncontradoError,
  LoteNoEnBorradorError,
  ItemNoEncontradoError,
  LoteSinItemsError,
} from './envio-masivo.errors.js';

describe('EnvioMasivo domain errors', () => {
  it('LoteNoEncontradoError incluye id y statusCode 404', () => {
    const e = new LoteNoEncontradoError(4);
    expect(e).toBeInstanceOf(Error);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('4');
    expect(e.name).toBe('LoteNoEncontradoError');
  });

  it('LoteNoEnBorradorError incluye id y statusCode 409', () => {
    const e = new LoteNoEnBorradorError(2);
    expect(e.statusCode).toBe(409);
    expect(e.message).toContain('2');
    expect(e.name).toBe('LoteNoEnBorradorError');
  });

  it('ItemNoEncontradoError incluye id y statusCode 404', () => {
    const e = new ItemNoEncontradoError(7);
    expect(e.statusCode).toBe(404);
    expect(e.message).toContain('7');
    expect(e.name).toBe('ItemNoEncontradoError');
  });

  it('LoteSinItemsError tiene mensaje fijo y statusCode 422', () => {
    const e = new LoteSinItemsError();
    expect(e.statusCode).toBe(422);
    expect(e.message).toContain('items');
    expect(e.name).toBe('LoteSinItemsError');
  });
});
