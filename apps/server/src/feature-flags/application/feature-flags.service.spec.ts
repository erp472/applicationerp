import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureFlagsService } from './feature-flags.service.js';
import { FeatureFlagNotFoundError, FeatureFlagCodigoDuplicadoError } from '../domain/feature-flags.errors.js';
import type { FeatureFlagEntity } from '../domain/feature-flag.entity.js';

// ─── Fixture helper ──────────────────────────────────────────────────────────

function makeFlag(overrides: Partial<FeatureFlagEntity> = {}): FeatureFlagEntity {
  return {
    id: 1,
    codigo: 'modulo:ventas',
    descripcion: 'Módulo de ventas',
    activo: true,
    entorno: 'all',
    plataforma: 'all',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
    usuarios: [],
    ...overrides,
  };
}

function makeRepo() {
  return {
    findAll:       vi.fn().mockResolvedValue([]),
    findById:      vi.fn().mockResolvedValue(null),
    findByCodigo:  vi.fn().mockResolvedValue(null),
    findActivos:   vi.fn().mockResolvedValue([]),
    create:        vi.fn().mockResolvedValue(makeFlag()),
    update:        vi.fn().mockResolvedValue(makeFlag()),
    remove:        vi.fn().mockResolvedValue(undefined),
    asignarRol:    vi.fn().mockResolvedValue(undefined),
    revocarRol:    vi.fn().mockResolvedValue(undefined),
    asignarUsuario: vi.fn().mockResolvedValue(undefined),
    revocarUsuario: vi.fn().mockResolvedValue(undefined),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FeatureFlagsService', () => {
  describe('isActive() — evaluación de flags (kill-switch modular)', () => {
    it('retorna false si el flag no existe', async () => {
      const repo = makeRepo();
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const activo = await svc.isActive('inexistente', 'prod');
      expect(activo).toBe(false);
    });

    it('retorna false si el flag existe pero está inactivo', async () => {
      const repo = makeRepo();
      repo.findByCodigo.mockResolvedValue(makeFlag({ activo: false }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const activo = await svc.isActive('modulo:ventas', 'prod');
      expect(activo).toBe(false);
    });

    it('retorna true si el flag está activo para el entorno correcto', async () => {
      const repo = makeRepo();
      repo.findByCodigo.mockResolvedValue(makeFlag({ activo: true, entorno: 'all' }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const activo = await svc.isActive('modulo:ventas', 'prod');
      expect(activo).toBe(true);
    });

    it('retorna false si el flag es para prod pero se consulta en dev', async () => {
      const repo = makeRepo();
      repo.findByCodigo.mockResolvedValue(makeFlag({ activo: true, entorno: 'prod' }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const activo = await svc.isActive('modulo:ventas', 'dev');
      expect(activo).toBe(false);
    });

    it('retorna true si el flag aplica por rol', async () => {
      const repo = makeRepo();
      repo.findByCodigo.mockResolvedValue(makeFlag({
        activo: true, entorno: 'all',
        roles: [{ id: 1, codigo: 'CAJERO', nombre: 'Cajero' }],
      }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const activo = await svc.isActive('modulo:ventas', 'prod', { rol: 'CAJERO' });
      expect(activo).toBe(true);
    });

    it('retorna false si el flag solo aplica a otro rol', async () => {
      const repo = makeRepo();
      repo.findByCodigo.mockResolvedValue(makeFlag({
        activo: true, entorno: 'all',
        roles: [{ id: 2, codigo: 'SUPERVISOR_REGIONAL', nombre: 'Supervisor' }],
      }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const activo = await svc.isActive('modulo:ventas', 'prod', { rol: 'CAJERO' });
      expect(activo).toBe(false);
    });

    it('retorna true si el flag aplica al usuario específico', async () => {
      const repo = makeRepo();
      repo.findByCodigo.mockResolvedValue(makeFlag({
        activo: true, entorno: 'all',
        usuarios: [{ id: 42, nombre: 'Juan', email: 'juan@4-72.co' }],
      }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const activo = await svc.isActive('modulo:ventas', 'prod', { usuarioId: 42 });
      expect(activo).toBe(true);
    });
  });

  describe('create() — validación de duplicados', () => {
    it('lanza FeatureFlagCodigoDuplicadoError si el código ya existe', async () => {
      const repo = makeRepo();
      repo.findByCodigo.mockResolvedValue(makeFlag({ codigo: 'modulo:ventas' }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await expect(svc.create({ codigo: 'modulo:ventas', activo: true, entorno: 'all', plataforma: 'all', roles: [] }))
        .rejects.toThrow(FeatureFlagCodigoDuplicadoError);
    });

    it('crea el flag si el código es único', async () => {
      const repo = makeRepo();
      repo.findByCodigo.mockResolvedValue(null);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const result = await svc.create({ codigo: 'nuevo:flag', activo: true, entorno: 'all', plataforma: 'all', roles: [] });
      expect(repo.create).toHaveBeenCalledOnce();
      expect(result).toBeDefined();
    });
  });

  describe('findOne() — manejo de not found', () => {
    it('lanza FeatureFlagNotFoundError si no existe el id', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(null);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await expect(svc.findOne(999)).rejects.toThrow(FeatureFlagNotFoundError);
    });

    it('retorna el flag si existe', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(makeFlag({ id: 5 }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const flag = await svc.findOne(5);
      expect(flag.id).toBe(5);
    });
  });

  describe('remove() — eliminación', () => {
    it('lanza error si el flag no existe', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(null);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await expect(svc.remove(99)).rejects.toThrow(FeatureFlagNotFoundError);
    });

    it('elimina el flag correctamente', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(makeFlag({ id: 3 }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const result = await svc.remove(3);
      expect(result).toEqual({ id: 3, eliminado: true });
      expect(repo.remove).toHaveBeenCalledWith(3);
    });
  });

  describe('findAll() — listado', () => {
    it('delega al repo sin filtro de entorno', async () => {
      const repo = makeRepo();
      repo.findAll.mockResolvedValue([makeFlag()]);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const result = await svc.findAll();
      expect(repo.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(1);
    });

    it('delega al repo con filtro de entorno', async () => {
      const repo = makeRepo();
      repo.findAll.mockResolvedValue([makeFlag({ entorno: 'prod' })]);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await svc.findAll('prod');
      expect(repo.findAll).toHaveBeenCalledWith('prod');
    });
  });

  describe('getActivos() — flags activos filtrados por contexto', () => {
    it('retorna flags que aplican al entorno y contexto dado', async () => {
      const repo = makeRepo();
      repo.findActivos.mockResolvedValue([makeFlag({ activo: true, roles: [], usuarios: [] })]);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const result = await svc.getActivos('prod');
      expect(result).toHaveLength(1);
    });

    it('filtra por plataforma usando ctx.plataforma', async () => {
      const repo = makeRepo();
      repo.findActivos.mockResolvedValue([]);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await svc.getActivos('prod', { plataforma: 'web' });
      expect(repo.findActivos).toHaveBeenCalledWith('prod', 'web');
    });

    it('usa "all" como plataforma cuando no se provee ctx', async () => {
      const repo = makeRepo();
      repo.findActivos.mockResolvedValue([]);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await svc.getActivos('dev');
      expect(repo.findActivos).toHaveBeenCalledWith('dev', 'all');
    });
  });

  describe('update() — actualización', () => {
    it('lanza error si el flag no existe', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(null);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await expect(svc.update(99, { activo: false })).rejects.toThrow(FeatureFlagNotFoundError);
    });

    it('actualiza el flag cuando existe', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(makeFlag({ id: 2 }));
      const updated = makeFlag({ id: 2, activo: false });
      repo.update.mockResolvedValue(updated);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      const result = await svc.update(2, { activo: false });
      expect(repo.update).toHaveBeenCalledWith(2, { activo: false });
      expect(result.activo).toBe(false);
    });
  });

  describe('asignarRol / revocarRol', () => {
    it('asignarRol delega al repo y retorna el flag actualizado', async () => {
      const repo = makeRepo();
      const flag = makeFlag({ id: 1 });
      repo.findById.mockResolvedValue(flag);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await svc.asignarRol(1, 10);
      expect(repo.asignarRol).toHaveBeenCalledWith(1, 10);
    });

    it('asignarRol lanza error si el flag no existe', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(null);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await expect(svc.asignarRol(99, 1)).rejects.toThrow(FeatureFlagNotFoundError);
    });

    it('revocarRol delega al repo', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(makeFlag({ id: 1 }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await svc.revocarRol(1, 10);
      expect(repo.revocarRol).toHaveBeenCalledWith(1, 10);
    });

    it('revocarRol lanza error si el flag no existe', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(null);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await expect(svc.revocarRol(99, 1)).rejects.toThrow(FeatureFlagNotFoundError);
    });
  });

  describe('asignarUsuario / revocarUsuario', () => {
    it('asignarUsuario delega al repo', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(makeFlag({ id: 1 }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await svc.asignarUsuario(1, 42);
      expect(repo.asignarUsuario).toHaveBeenCalledWith(1, 42);
    });

    it('asignarUsuario lanza error si el flag no existe', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(null);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await expect(svc.asignarUsuario(99, 42)).rejects.toThrow(FeatureFlagNotFoundError);
    });

    it('revocarUsuario delega al repo', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(makeFlag({ id: 1 }));
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await svc.revocarUsuario(1, 42);
      expect(repo.revocarUsuario).toHaveBeenCalledWith(1, 42);
    });

    it('revocarUsuario lanza error si el flag no existe', async () => {
      const repo = makeRepo();
      repo.findById.mockResolvedValue(null);
      const svc = new (FeatureFlagsService as never)(repo) as FeatureFlagsService;
      await expect(svc.revocarUsuario(99, 42)).rejects.toThrow(FeatureFlagNotFoundError);
    });
  });
});
