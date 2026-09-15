import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';

vi.mock('@node-rs/bcrypt', () => ({ compare: vi.fn() }));

import { compare } from '@node-rs/bcrypt';
import { AuthService } from './auth.service.js';

const mockCompare = vi.mocked(compare);

const baseUsuario = {
  idusuarios:              1,
  emailusuarios:           'cajero@4-72.co',
  password_hashusuarios:   '$2y$10$hashed',
  sucursales_idsucursales: 2,
  nombreusuarios:          'Juan Cajero',
  activousuarios:          true,
  rol: { idroles: 10, codigoroles: 'CAJERO' },
};

function makePrisma(usuarioOverride: unknown = baseUsuario) {
  return {
    usuario: {
      findUnique: vi.fn().mockResolvedValue(usuarioOverride),
      update:     vi.fn().mockResolvedValue({}),
    },
    sucursal: {
      findUnique: vi.fn().mockResolvedValue({ regionales_idregionales: 5 }),
    },
    equipoAutorizado: {
      findFirst: vi.fn().mockResolvedValue({ id: 1 }),
    },
  };
}

function makeJwt() {
  return { sign: vi.fn().mockReturnValue('jwt-token') };
}

function makePermisos() {
  return {
    getPermisosDeRol: vi.fn().mockResolvedValue([
      { permiso: { codigopermisos: 'ventas:crear' } },
    ]),
  };
}

function makeSvc(prisma = makePrisma()) {
  const jwt      = makeJwt();
  const permisos = makePermisos();
  const svc = new (AuthService as never)(prisma, jwt, permisos) as AuthService;
  return { svc, prisma, jwt, permisos };
}

describe('AuthService', () => {
  beforeEach(() => {
    mockCompare.mockReset();
  });

  describe('login()', () => {
    it('lanza UnauthorizedException si el usuario no existe', async () => {
      const { svc } = makeSvc(makePrisma(null));
      await expect(svc.login({ email: 'x@x.co', password: '123' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario está inactivo', async () => {
      const { svc } = makeSvc(makePrisma({ ...baseUsuario, activousuarios: false }));
      await expect(svc.login({ email: 'cajero@4-72.co', password: '123' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      mockCompare.mockResolvedValue(false as never);
      const { svc } = makeSvc();
      await expect(svc.login({ email: 'cajero@4-72.co', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('lanza error de escritorio si cajero no usa plataforma tauri', async () => {
      mockCompare.mockResolvedValue(true as never);
      const { svc } = makeSvc();
      await expect(
        svc.login({ email: 'cajero@4-72.co', password: 'correct' }, '00:11:22:33:44:55', 'web'),
      ).rejects.toThrow(/escritorio/);
    });

    it('lanza UnauthorizedException si equipo de cajero no está autorizado', async () => {
      mockCompare.mockResolvedValue(true as never);
      const prisma = makePrisma();
      prisma.equipoAutorizado.findFirst.mockResolvedValue(null);
      const { svc } = makeSvc(prisma);
      await expect(
        svc.login({ email: 'cajero@4-72.co', password: 'correct' }, '00:11:22:33:44:55', 'tauri'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('retorna access_token para ADMIN_SISTEMA sin validar MAC', async () => {
      mockCompare.mockResolvedValue(true as never);
      const admin = { ...baseUsuario, rol: { idroles: 1, codigoroles: 'ADMIN_SISTEMA' } };
      const { svc, jwt } = makeSvc(makePrisma(admin));
      const result = await svc.login({ email: 'admin@4-72.co', password: 'correct' });
      expect(result.access_token).toBe('jwt-token');
      expect(result.usuario.rol).toBe('ADMIN_SISTEMA');
      expect(jwt.sign).toHaveBeenCalledOnce();
    });

    it('retorna access_token para ADMIN_NACIONAL sin validar MAC', async () => {
      mockCompare.mockResolvedValue(true as never);
      const admin = { ...baseUsuario, rol: { idroles: 2, codigoroles: 'ADMIN_NACIONAL' } };
      const { svc } = makeSvc(makePrisma(admin));
      const result = await svc.login({ email: 'admin@4-72.co', password: 'correct' });
      expect(result.access_token).toBeDefined();
    });

    it('retorna access_token para cajero con equipo autorizado en tauri', async () => {
      mockCompare.mockResolvedValue(true as never);
      const { svc } = makeSvc();
      const result = await svc.login(
        { email: 'cajero@4-72.co', password: 'correct' },
        '00:11:22:33:44:55',
        'tauri',
      );
      expect(result.access_token).toBe('jwt-token');
      expect(result.usuario.id).toBe(1);
    });
  });

  describe('getProfile()', () => {
    it('retorna null si el usuario no existe', async () => {
      const { svc, prisma } = makeSvc();
      prisma.usuario.findUnique.mockResolvedValue(null);
      const result = await svc.getProfile(999);
      expect(result).toBeNull();
    });

    it('retorna perfil completo cuando el usuario existe', async () => {
      const { svc, prisma } = makeSvc();
      prisma.usuario.findUnique.mockResolvedValue({
        idusuarios:              1,
        nombreusuarios:          'Juan Cajero',
        emailusuarios:           'cajero@4-72.co',
        sucursales_idsucursales: 2,
        activousuarios:          true,
        ultimo_loginusuarios:    new Date('2026-09-01'),
        rol: { idroles: 10, codigoroles: 'CAJERO' },
      });
      const result = await svc.getProfile(1);
      expect(result?.email).toBe('cajero@4-72.co');
      expect(result?.rol).toBe('CAJERO');
      expect(result?.activo).toBe(true);
      expect(result?.permisos).toContain('ventas:crear');
    });
  });
});
