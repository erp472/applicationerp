import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks mínimos ────────────────────────────────────────────────────────────

const prismaMock = {
  eventoAuditoria: {
    create:  vi.fn().mockResolvedValue({ ideventos_auditoria: 1 }),
    count:   vi.fn().mockResolvedValue(0),
    findMany: vi.fn().mockResolvedValue([]),
    groupBy: vi.fn().mockResolvedValue([]),
  },
};

const mongoAuditMock = {
  log: vi.fn().mockResolvedValue(undefined),
};

async function buildService() {
  const { AuditService } = await import('./audit.service.js');
  return new (AuditService as never)(prismaMock, mongoAuditMock) as InstanceType<typeof AuditService>;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('log() — escritura en PostgreSQL', () => {
    it('crea un evento de auditoría en PostgreSQL', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'CREATE', entidad: 'usuarios', resultado: 'OK' });
      expect(prismaMock.eventoAuditoria.create).toHaveBeenCalledOnce();
    });

    it('mapea CREATE a operacion INSERT en PG', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'CREATE', entidad: 'usuarios', resultado: 'OK' });
      const callArg = prismaMock.eventoAuditoria.create.mock.calls[0][0];
      expect(callArg.data.operacioneventos_auditoria).toBe('INSERT');
    });

    it('mapea UPDATE a operacion UPDATE en PG', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'UPDATE', entidad: 'usuarios', resultado: 'OK' });
      const callArg = prismaMock.eventoAuditoria.create.mock.calls[0][0];
      expect(callArg.data.operacioneventos_auditoria).toBe('UPDATE');
    });

    it('mapea DELETE a operacion DELETE en PG', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'DELETE', entidad: 'usuarios', resultado: 'OK' });
      const callArg = prismaMock.eventoAuditoria.create.mock.calls[0][0];
      expect(callArg.data.operacioneventos_auditoria).toBe('DELETE');
    });

    it('asigna el usuario_id correctamente', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'READ', entidad: 'ventas', resultado: 'OK', usuario_id: 99 });
      const callArg = prismaMock.eventoAuditoria.create.mock.calls[0][0];
      expect(callArg.data.usuarios_idusuarios).toBe(99);
    });

    it('almacena ip_origen en el registro', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'CREATE', entidad: 'auth', resultado: 'OK', ip_origen: '192.168.1.1' });
      const callArg = prismaMock.eventoAuditoria.create.mock.calls[0][0];
      expect(callArg.data.ip_origeneventos_auditoria).toBe('192.168.1.1');
    });
  });

  describe('log() — dual-write a MongoDB (NIST 800-61r3 trazabilidad)', () => {
    it('realiza dual-write a MongoDB cuando hay audit_key', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'CREATE', entidad: 'ventas', resultado: 'OK', audit_key: 'FIN-01', tipo: 'FIN' });
      // Esperamos que mongoAudit.log sea llamado (puede ser fire-and-forget, esperar un tick)
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mongoAuditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ audit_key: 'FIN-01', tipo: 'FIN', accion: 'CREATE' }),
      );
    });

    it('NO hace dual-write a MongoDB si no hay audit_key', async () => {
      const svc = await buildService();
      await svc.log({ accion: 'READ', entidad: 'unknown', resultado: 'OK' });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mongoAuditMock.log).not.toHaveBeenCalled();
    });

    it('incluye usuario_id y ip en el payload de MongoDB', async () => {
      const svc = await buildService();
      await svc.log({
        accion: 'CREATE', entidad: 'giros', resultado: 'OK',
        audit_key: 'FIN-01', tipo: 'FIN',
        usuario_id: 55, ip_origen: '10.0.0.1',
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mongoAuditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ usuario_id: 55, ip: '10.0.0.1' }),
      );
    });
  });

  describe('log() — tipos de transacción (catálogo ADM/OPE/FIN)', () => {
    it.each([
      ['ADM-01','ADM'],['ADM-03','ADM'],['ADM-08','ADM'],
      ['OPE-01','OPE'],['OPE-03','OPE'],['OPE-07','OPE'],
      ['FIN-01','FIN'],['FIN-03','FIN'],
    ])('audit_key %s tiene tipo %s en MongoDB', async (codigo, tipo) => {
      vi.clearAllMocks();
      const svc = await buildService();
      await svc.log({ accion: 'CREATE', entidad: 'test', resultado: 'OK', audit_key: codigo, tipo: tipo as 'ADM' | 'OPE' | 'FIN' });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mongoAuditMock.log).toHaveBeenCalledWith(expect.objectContaining({ audit_key: codigo, tipo }));
    });
  });

  describe('statsHoy() — métricas del día', () => {
    it('retorna contadores del día correctamente', async () => {
      prismaMock.eventoAuditoria.count.mockResolvedValue(10);
      prismaMock.eventoAuditoria.groupBy.mockResolvedValue([
        { operacioneventos_auditoria: 'INSERT', _count: 8 },
        { operacioneventos_auditoria: 'UPDATE', _count: 2 },
      ]);
      const svc = await buildService();
      const stats = await svc.statsHoy();
      expect(stats.total).toBe(10);
      expect(stats.inserciones).toBe(8);
      expect(stats.actualizaciones).toBe(2);
    });
  });
});
