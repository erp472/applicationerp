import { describe, it, expect } from 'vitest';
import { api } from './helpers.js';

describe('Health — /health', () => {
  it('retorna 200', async () => {
    const r = await api.get('/health');
    expect(r.status).toBe(200);
  });

  it('estructura terminus: status + info', async () => {
    const r = await api.get('/health');
    expect(r.body).toHaveProperty('status');
    expect(['ok', 'error']).toContain(r.body.status);
    expect(r.body).toHaveProperty('info');
  });

  it('uso de memoria dentro del límite (status ok)', async () => {
    const r = await api.get('/health');
    expect(r.body.status).toBe('ok');
  });
});
