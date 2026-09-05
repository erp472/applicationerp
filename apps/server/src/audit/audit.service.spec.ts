import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks mínimos ────────────────────────────────────────────────────────────

const prismaMock = {
  usuario: { findMany: vi.fn().mockResolvedValue([]) },
};

const mongoAuditMock = {
  log:        vi.fn(),
  find:       vi.fn().mockResolvedValue({ total: 0, datos: [] }),
  statsDesde: vi.fn().mockResolvedValue({ porAccion: {}, errores: 0 }),
  cursor:     vi.fn(),
};

/** Imita lo justo del cursor de Mongoose que consume exportCsv. */
function cursorDe(docs: unknown[]) {
  return {
    async *[Symbol.asyncIterator]() { yield* docs; },
    close: vi.fn().mockResolvedValue(undefined),
  };
}

async function recolectar(gen: AsyncGenerator<string>) {
  let csv = '';
  for await (const trozo of gen) csv += trozo;
  return csv;
}

const realtimeMock = {
  broadcastToRoles: vi.fn(),
};

async function buildService() {
  const { AuditService } = await import('./audit.service.js');
  return new (AuditService as never)(
    prismaMock, mongoAuditMock, realtimeMock,
  ) as InstanceType<typeof AuditService>;
}

function evento(over: Record<string, unknown> = {}) {
  return {
    _id: 'a1', audit_key: 'FIN-01', tipo: 'FIN', accion: 'CREATE',
    entidad: 'ventas', entidad_id: '7', ip: '10.0.0.1',
    payload_antes: null, payload_despues: { accion: 'CREATE' },
    resultado: 'OK', timestamp: new Date('2026-09-04T15:00:00Z'),
    ...over,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mongoAuditMock.find.mockResolvedValue({ total: 0, datos: [] });
    mongoAuditMock.statsDesde.mockResolvedValue({ porAccion: {}, errores: 0 });
    mongoAuditMock.cursor.mockReturnValue(cursorDe([]));
    prismaMock.usuario.findMany.mockResolvedValue([]);
  });

  describe('log() — MongoDB es el único almacén', () => {
    it('escribe el evento en MongoDB', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'CREATE', entidad: 'ventas', resultado: 'OK', audit_key: 'FIN-01', tipo: 'FIN' });
      expect(mongoAuditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ audit_key: 'FIN-01', tipo: 'FIN', accion: 'CREATE' }),
      );
    });

    it('registra también los eventos sin audit_key, marcados como SIN-CLAVE', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'READ', entidad: 'desconocida', resultado: 'OK' });
      expect(mongoAuditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ audit_key: 'SIN-CLAVE', tipo: 'OPE' }),
      );
    });

    it('incluye usuario_id e ip en el evento', async () => {
      const svc = await buildService();
      await svc.log({
        accion: 'CREATE', entidad: 'giros', resultado: 'OK',
        audit_key: 'FIN-01', tipo: 'FIN', usuario_id: 55, ip_origen: '10.0.0.1',
      });
      expect(mongoAuditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ usuario_id: 55, ip: '10.0.0.1' }),
      );
    });

    it('redacta credenciales antes de persistir', async () => {
      const svc = await buildService();
      await svc.log({
        accion: 'UPDATE', entidad: 'usuarios', resultado: 'OK', audit_key: 'ADM-01', tipo: 'ADM',
        datos_antes:   { email: 'a@b.co', password_hashusuarios: '$2y$10$abc' },
        datos_despues: { password_hashusuarios: '$2y$10$xyz' },
      });
      const arg = mongoAuditMock.log.mock.calls[0]![0] as Record<string, Record<string, unknown>>;
      expect(arg['payload_antes']!['password_hashusuarios']).toBe('[REDACTADO]');
      expect(arg['payload_despues']!['password_hashusuarios']).toBe('[REDACTADO]');
      expect(arg['payload_antes']!['email']).toBe('a@b.co');
    });

    it('difunde el evento solo al rol de auditoría', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'CREATE', entidad: 'ventas', resultado: 'OK', audit_key: 'FIN-01', tipo: 'FIN' });
      expect(realtimeMock.broadcastToRoles).toHaveBeenCalledWith(
        ['ADMIN_SISTEMA'], 'audit.event', expect.objectContaining({ audit_key: 'FIN-01' }),
      );
    });

    it.each([
      ['ADM-01','ADM'],['ADM-03','ADM'],['OPE-01','OPE'],['FIN-01','FIN'],['FIN-03','FIN'],
    ])('audit_key %s conserva su tipo %s', async (codigo, tipo) => {
      const svc = await buildService();
      await svc.log({ accion: 'CREATE', entidad: 'test', resultado: 'OK', audit_key: codigo, tipo: tipo as 'ADM' | 'OPE' | 'FIN' });
      expect(mongoAuditMock.log).toHaveBeenCalledWith(expect.objectContaining({ audit_key: codigo, tipo }));
    });
  });

  describe('findAll() — lectura desde MongoDB', () => {
    it('traduce el filtro por operación a las acciones equivalentes', async () => {
      const svc = await buildService();
      await svc.findAll({ operacion: 'DELETE', pagina: 1, limite: 50 });
      expect(mongoAuditMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ acciones: ['DELETE'] }),
      );
    });

    it('INSERT cubre todas las acciones que no son UPDATE ni DELETE', async () => {
      const svc = await buildService();
      await svc.findAll({ operacion: 'INSERT', pagina: 1, limite: 50 });
      const { acciones } = mongoAuditMock.find.mock.calls[0]![0] as { acciones: string[] };
      expect(acciones).toContain('LOGIN');
      expect(acciones).toContain('DENIED');
      expect(acciones).not.toContain('UPDATE');
    });

    it('el filtro por acción tiene prioridad sobre el de operación', async () => {
      const svc = await buildService();
      await svc.findAll({ operacion: 'INSERT', accion: 'LOGIN', pagina: 1, limite: 50 });
      expect(mongoAuditMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ acciones: ['LOGIN'] }),
      );
    });

    it('mapea el documento de Mongo a la forma que consume el panel', async () => {
      mongoAuditMock.find.mockResolvedValue({ total: 1, datos: [evento()] });
      const svc = await buildService();
      const res = await svc.findAll({ pagina: 1, limite: 50 });
      expect(res.datos[0]).toMatchObject({
        id: 'a1', auditKey: 'FIN-01', tabla: 'ventas',
        operacion: 'INSERT', accion: 'CREATE', registroId: '7',
        ipOrigen: '10.0.0.1', createdAt: '2026-09-04T15:00:00.000Z',
      });
    });

    it('resuelve el usuario contra PostgreSQL', async () => {
      mongoAuditMock.find.mockResolvedValue({ total: 1, datos: [evento({ usuario_id: 8 })] });
      prismaMock.usuario.findMany.mockResolvedValue([
        { idusuarios: 8, nombreusuarios: 'Admin', emailusuarios: 'admin@4-72.com.co' },
      ]);
      const svc = await buildService();
      const res = await svc.findAll({ pagina: 1, limite: 50 });
      expect(res.datos[0]!.usuario).toEqual({ id: 8, nombre: 'Admin', email: 'admin@4-72.com.co' });
    });

    it('no consulta PostgreSQL si ningún evento tiene usuario', async () => {
      mongoAuditMock.find.mockResolvedValue({ total: 1, datos: [evento()] });
      const svc = await buildService();
      const res = await svc.findAll({ pagina: 1, limite: 50 });
      expect(prismaMock.usuario.findMany).not.toHaveBeenCalled();
      expect(res.datos[0]!.usuario).toBeNull();
    });

    it('deja el usuario en null si el id ya no existe en PostgreSQL', async () => {
      mongoAuditMock.find.mockResolvedValue({ total: 1, datos: [evento({ usuario_id: 999 })] });
      const svc = await buildService();
      const res = await svc.findAll({ pagina: 1, limite: 50 });
      expect(res.datos[0]!.usuario).toBeNull();
    });

    it('calcula la paginación', async () => {
      mongoAuditMock.find.mockResolvedValue({ total: 101, datos: [] });
      const svc = await buildService();
      const res = await svc.findAll({ pagina: 2, limite: 50 });
      expect(res.meta).toEqual({ total: 101, pagina: 2, limite: 50, paginas: 3 });
    });
  });

  describe('statsHoy() — métricas del día', () => {
    it('agrupa las acciones en operaciones de tabla', async () => {
      mongoAuditMock.statsDesde.mockResolvedValue({
        porAccion: { CREATE: 5, LOGIN: 3, UPDATE: 2, DELETE: 1 },
        errores:   4,
      });
      const svc = await buildService();
      const stats = await svc.statsHoy();
      expect(stats).toEqual({
        total: 11, inserciones: 8, actualizaciones: 2, eliminaciones: 1, errores: 4,
      });
    });

    it('devuelve ceros cuando no hay eventos', async () => {
      const svc = await buildService();
      expect(await svc.statsHoy()).toEqual({
        total: 0, inserciones: 0, actualizaciones: 0, eliminaciones: 0, errores: 0,
      });
    });
  });

  describe('exportCsv() — CSV en streaming', () => {
    it('abre el cursor con los filtros y sin paginar', async () => {
      const svc = await buildService();
      await recolectar(svc.exportCsv({ tabla: 'ventas', accion: 'CREATE', usuarioId: 8 }));
      expect(mongoAuditMock.cursor).toHaveBeenCalledWith(
        expect.objectContaining({ entidad: 'ventas', acciones: ['CREATE'], usuarioId: 8 }),
        1000,
      );
    });

    it('emite el BOM y la cabecera aunque no haya eventos', async () => {
      const svc = await buildService();
      const csv = await recolectar(svc.exportCsv({}));
      expect(csv).toBe('﻿Fecha/Hora,Código,Categoría,Acción,Tabla,Registro,Usuario,Email,IP,Resultado,Error\r\n');
    });

    it('escribe una fila por evento con el usuario resuelto', async () => {
      mongoAuditMock.cursor.mockReturnValue(cursorDe([evento({ usuario_id: 8 })]));
      prismaMock.usuario.findMany.mockResolvedValue([
        { idusuarios: 8, nombreusuarios: 'Ana', emailusuarios: 'ana@4-72.com.co' },
      ]);
      const svc = await buildService();
      const filas = (await recolectar(svc.exportCsv({}))).trimEnd().split('\r\n');
      expect(filas[1]).toBe(
        '2026-09-04T15:00:00.000Z,FIN-01,FIN,CREATE,ventas,7,Ana,ana@4-72.com.co,10.0.0.1,OK,',
      );
    });

    it('entrecomilla los valores con coma o comillas', async () => {
      mongoAuditMock.cursor.mockReturnValue(cursorDe([
        evento({ error_msg: 'falló "x", reintentar' }),
      ]));
      const svc = await buildService();
      const csv = await recolectar(svc.exportCsv({}));
      expect(csv).toContain('"falló ""x"", reintentar"');
    });

    it('consulta PostgreSQL una sola vez por usuario repetido', async () => {
      mongoAuditMock.cursor.mockReturnValue(cursorDe([
        evento({ usuario_id: 8 }), evento({ usuario_id: 8 }), evento({ usuario_id: 8 }),
      ]));
      const svc = await buildService();
      await recolectar(svc.exportCsv({}));
      expect(prismaMock.usuario.findMany).toHaveBeenCalledTimes(1);
    });

    it('no pierde ni duplica filas al cruzar el límite del lote', async () => {
      const docs = Array.from({ length: 2500 }, (_, i) => evento({ entidad_id: String(i) }));
      mongoAuditMock.cursor.mockReturnValue(cursorDe(docs));
      const svc = await buildService();

      const trozos: string[] = [];
      for await (const trozo of svc.exportCsv({})) trozos.push(trozo);

      // cabecera + lotes de 1000, 1000 y 500
      expect(trozos).toHaveLength(4);
      const filas = trozos.join('').trimEnd().split('\r\n');
      expect(filas).toHaveLength(2501);
      expect(new Set(filas.slice(1).map((f) => f.split(',')[5])).size).toBe(2500);
    });

    it('cierra el cursor al terminar', async () => {
      const cursor = cursorDe([evento()]);
      mongoAuditMock.cursor.mockReturnValue(cursor);
      const svc = await buildService();
      await recolectar(svc.exportCsv({}));
      expect(cursor.close).toHaveBeenCalled();
    });
  });
});
