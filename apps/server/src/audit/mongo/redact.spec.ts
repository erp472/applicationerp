import { describe, it, expect } from 'vitest';
import { redact, REDACTADO } from './redact.js';

describe('redact — campos sensibles en auditoría', () => {
  it('redacta el hash de contraseña que el middleware de Prisma vuelca de la fila usuarios', () => {
    const fila = {
      idusuarios:            7,
      emailusuarios:         'admin@4-72.com.co',
      password_hashusuarios: '$2y$10$abcdefghijklmnopqrstuv',
      activousuarios:        true,
    };
    expect(redact(fila)).toEqual({
      idusuarios:            7,
      emailusuarios:         'admin@4-72.com.co',
      password_hashusuarios: REDACTADO,
      activousuarios:        true,
    });
  });

  it('conserva la clave para que la traza siga mostrando que el campo cambió', () => {
    const salida = redact({ password_hashusuarios: 'x' }) as Record<string, unknown>;
    expect(Object.keys(salida)).toContain('password_hashusuarios');
  });

  it('redacta en objetos anidados y dentro de arreglos', () => {
    const entrada = {
      usuarios: [
        { id: 1, token: 'abc' },
        { id: 2, perfil: { secret_key: 'xyz' } },
      ],
    };
    expect(redact(entrada)).toEqual({
      usuarios: [
        { id: 1, token: REDACTADO },
        { id: 2, perfil: { secret_key: REDACTADO } },
      ],
    });
  });

  it('cubre las variantes de nombre usadas en el esquema', () => {
    const entrada = {
      password: 'a', passwordHash: 'b', token: 'c',
      secret: 'd', clave: 'e', contrasena: 'f', hash: 'g',
    };
    for (const v of Object.values(redact(entrada) as Record<string, unknown>)) {
      expect(v).toBe(REDACTADO);
    }
  });

  it('no altera valores no sensibles ni rompe con null, fechas o primitivos', () => {
    const fecha = new Date('2026-09-04T00:00:00Z');
    expect(redact(null)).toBeNull();
    expect(redact(42)).toBe(42);
    expect(redact('texto')).toBe('texto');
    expect(redact({ creado: fecha })).toEqual({ creado: fecha });
    expect(redact({ total: 2800, nombre: 'Envío' })).toEqual({ total: 2800, nombre: 'Envío' });
  });
});
