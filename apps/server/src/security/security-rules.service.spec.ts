import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Tipos mínimos para los tests ────────────────────────────────────────────

interface MongoAuditServiceMock {
  countLoginFailures: ReturnType<typeof vi.fn>;
  countDeniedByUser: ReturnType<typeof vi.fn>;
  countEventsByUser: ReturnType<typeof vi.fn>;
  countFailuresByIp: ReturnType<typeof vi.fn>;
}

interface RealtimeServiceMock {
  broadcast: ReturnType<typeof vi.fn>;
}

interface AlertModelMock {
  create: ReturnType<typeof vi.fn>;
}

// ─── Factory para instanciar SecurityRulesService con mocks ──────────────────
// Usa instanciación directa (sin NestJS TestingModule) para velocidad

async function buildService(
  mongoOverrides: Partial<MongoAuditServiceMock> = {},
  alertModelMock: Partial<AlertModelMock> = {},
) {
  const { SecurityRulesService } = await import('./security-rules.service.js');

  const mongoAudit: MongoAuditServiceMock = {
    countLoginFailures:   vi.fn().mockResolvedValue(0),
    countDeniedByUser:    vi.fn().mockResolvedValue(0),
    countEventsByUser:    vi.fn().mockResolvedValue(0),
    countFailuresByIp:    vi.fn().mockResolvedValue(0),
    ...mongoOverrides,
  };

  const realtimeService: RealtimeServiceMock = {
    broadcast: vi.fn(),
  };

  const alertModel: AlertModelMock = {
    create: vi.fn().mockResolvedValue({}),
    ...alertModelMock,
  };

  // Inyección manual sin decoradores NestJS
  const service = new (SecurityRulesService as never)(
    mongoAudit,
    realtimeService,
    alertModel,
  ) as InstanceType<typeof SecurityRulesService>;

  return { service, mongoAudit, realtimeService, alertModel };
}

// ─── Suites ──────────────────────────────────────────────────────────────────

describe('SecurityRulesService — Reglas de detección MITRE ATT&CK / NIST CSF v2', () => {

  describe('Regla 1 — Brute Force Login T1110.001 / DE.CM-7', () => {
    it('no dispara alerta si hay menos de 5 intentos fallidos', async () => {
      const { service, mongoAudit, realtimeService } = await buildService({
        countLoginFailures: vi.fn().mockResolvedValue(4),
      });
      await service.evaluate({ accion: 'LOGIN', entidad: 'auth', resultado: 'ERROR', ip_origen: '1.2.3.4' });
      expect(realtimeService.broadcast).not.toHaveBeenCalled();
      expect(mongoAudit.countLoginFailures).toHaveBeenCalledWith('1.2.3.4', 5);
    });

    it('dispara alerta CRITICAL si hay >= 5 intentos fallidos desde misma IP', async () => {
      const { service, realtimeService } = await buildService({
        countLoginFailures: vi.fn().mockResolvedValue(5),
      });
      await service.evaluate({ accion: 'LOGIN', entidad: 'auth', resultado: 'ERROR', ip_origen: '1.2.3.4' });
      expect(realtimeService.broadcast).toHaveBeenCalledWith(
        'security.alert',
        expect.objectContaining({ mitre: 'T1110.001', nist_csf: 'DE.CM-7', severidad: 'CRITICAL' }),
      );
    });

    it('no evalúa brute force si el resultado es OK', async () => {
      const { service, mongoAudit } = await buildService();
      await service.evaluate({ accion: 'LOGIN', entidad: 'auth', resultado: 'OK', ip_origen: '1.2.3.4' });
      expect(mongoAudit.countLoginFailures).not.toHaveBeenCalled();
    });

    it('no evalúa brute force si no hay ip_origen', async () => {
      const { service, mongoAudit } = await buildService();
      await service.evaluate({ accion: 'LOGIN', entidad: 'auth', resultado: 'ERROR' });
      expect(mongoAudit.countLoginFailures).not.toHaveBeenCalled();
    });
  });

  describe('Regla 2 — Feature Flag Denied Abuse T1562 / DE.AE-3', () => {
    it('no dispara alerta si hay menos de 3 DENIED del usuario', async () => {
      const { service, realtimeService } = await buildService({
        countDeniedByUser: vi.fn().mockResolvedValue(2),
      });
      await service.evaluate({ accion: 'DENIED', entidad: 'ventas', resultado: 'ERROR', usuario_id: 42 });
      expect(realtimeService.broadcast).not.toHaveBeenCalled();
    });

    it('dispara alerta HIGH si hay >= 3 DENIED del mismo usuario', async () => {
      const { service, realtimeService } = await buildService({
        countDeniedByUser: vi.fn().mockResolvedValue(3),
      });
      await service.evaluate({ accion: 'DENIED', entidad: 'ventas', resultado: 'ERROR', usuario_id: 42 });
      expect(realtimeService.broadcast).toHaveBeenCalledWith(
        'security.alert',
        expect.objectContaining({ mitre: 'T1562', nist_csf: 'DE.AE-3', severidad: 'HIGH' }),
      );
    });

    it('no evalúa si accion no es DENIED', async () => {
      const { service, mongoAudit } = await buildService();
      await service.evaluate({ accion: 'READ', entidad: 'ventas', resultado: 'ERROR', usuario_id: 42 });
      expect(mongoAudit.countDeniedByUser).not.toHaveBeenCalled();
    });

    it('no evalúa si no hay usuario_id', async () => {
      const { service, mongoAudit } = await buildService();
      await service.evaluate({ accion: 'DENIED', entidad: 'ventas', resultado: 'ERROR' });
      expect(mongoAudit.countDeniedByUser).not.toHaveBeenCalled();
    });
  });

  describe('Regla 3 — Bulk Data Access T1530 / DE.CM-6', () => {
    it('no dispara alerta si hay menos de 100 lecturas', async () => {
      const { service, realtimeService } = await buildService({
        countEventsByUser: vi.fn().mockResolvedValue(99),
      });
      await service.evaluate({ accion: 'READ', entidad: 'clientes', resultado: 'OK', usuario_id: 7 });
      expect(realtimeService.broadcast).not.toHaveBeenCalled();
    });

    it('dispara alerta MEDIUM si hay >= 100 lecturas en 5 min', async () => {
      const { service, realtimeService } = await buildService({
        countEventsByUser: vi.fn().mockResolvedValue(100),
      });
      await service.evaluate({ accion: 'READ', entidad: 'clientes', resultado: 'OK', usuario_id: 7 });
      expect(realtimeService.broadcast).toHaveBeenCalledWith(
        'security.alert',
        expect.objectContaining({ mitre: 'T1530', nist_csf: 'DE.CM-6', severidad: 'MEDIUM' }),
      );
    });
  });

  describe('Regla 4 — Anomalous Financial Operation Hour T1078 / DE.AE-2', () => {
    it('dispara alerta HIGH para operación FIN exitosa a las 3:00 UTC', async () => {
      vi.setSystemTime(new Date('2026-01-15T03:00:00Z'));
      const { service, realtimeService } = await buildService();
      await service.evaluate({ accion: 'CREATE', entidad: 'giros', resultado: 'OK', tipo: 'FIN' });
      expect(realtimeService.broadcast).toHaveBeenCalledWith(
        'security.alert',
        expect.objectContaining({ mitre: 'T1078', nist_csf: 'DE.AE-2', severidad: 'HIGH' }),
      );
      vi.useRealTimers();
    });

    it('no dispara alerta para operación FIN exitosa a las 14:00 UTC (horario normal)', async () => {
      vi.setSystemTime(new Date('2026-01-15T14:00:00Z'));
      const { service, realtimeService } = await buildService();
      await service.evaluate({ accion: 'CREATE', entidad: 'giros', resultado: 'OK', tipo: 'FIN' });
      expect(realtimeService.broadcast).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('no dispara alerta para operación FIN con resultado ERROR', async () => {
      vi.setSystemTime(new Date('2026-01-15T03:00:00Z'));
      const { service, realtimeService } = await buildService();
      await service.evaluate({ accion: 'CREATE', entidad: 'giros', resultado: 'ERROR', tipo: 'FIN' });
      expect(realtimeService.broadcast).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('no dispara alerta para operación ADM fuera de horario', async () => {
      vi.setSystemTime(new Date('2026-01-15T03:00:00Z'));
      const { service, realtimeService } = await buildService();
      await service.evaluate({ accion: 'READ', entidad: 'usuarios', resultado: 'OK', tipo: 'ADM' });
      expect(realtimeService.broadcast).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Regla 5 — IP Error Surge T1078 / DE.AE-3', () => {
    it('no dispara alerta si hay menos de 20 errores en 2 min', async () => {
      const { service, realtimeService } = await buildService({
        countFailuresByIp: vi.fn().mockResolvedValue(19),
      });
      await service.evaluate({ accion: 'CREATE', entidad: 'ventas', resultado: 'ERROR', ip_origen: '5.6.7.8' });
      expect(realtimeService.broadcast).not.toHaveBeenCalled();
    });

    it('dispara alerta MEDIUM si hay >= 20 errores desde misma IP en 2 min', async () => {
      const { service, realtimeService } = await buildService({
        countFailuresByIp: vi.fn().mockResolvedValue(20),
      });
      await service.evaluate({ accion: 'CREATE', entidad: 'ventas', resultado: 'ERROR', ip_origen: '5.6.7.8' });
      expect(realtimeService.broadcast).toHaveBeenCalledWith(
        'security.alert',
        expect.objectContaining({ mitre: 'T1078', nist_csf: 'DE.AE-3', severidad: 'MEDIUM' }),
      );
    });

    it('no evalúa si resultado es OK', async () => {
      const { service, mongoAudit } = await buildService();
      await service.evaluate({ accion: 'CREATE', entidad: 'ventas', resultado: 'OK', ip_origen: '5.6.7.8' });
      expect(mongoAudit.countFailuresByIp).not.toHaveBeenCalled();
    });
  });

  describe('emitAlert — persistencia y broadcast', () => {
    it('persiste alerta en MongoDB y hace broadcast WebSocket', async () => {
      const { service, alertModel, realtimeService } = await buildService({
        countLoginFailures: vi.fn().mockResolvedValue(10),
      });
      await service.evaluate({ accion: 'LOGIN', entidad: 'auth', resultado: 'ERROR', ip_origen: '9.9.9.9' });
      expect(alertModel.create).toHaveBeenCalled();
      expect(realtimeService.broadcast).toHaveBeenCalledWith('security.alert', expect.any(Object));
    });

    it('no lanza excepción si el modelo de alerta falla', async () => {
      const { service } = await buildService(
        { countLoginFailures: vi.fn().mockResolvedValue(10) },
        { create: vi.fn().mockRejectedValue(new Error('Mongo down')) },
      );
      await expect(
        service.evaluate({ accion: 'LOGIN', entidad: 'auth', resultado: 'ERROR', ip_origen: '9.9.9.9' }),
      ).resolves.not.toThrow();
    });
  });

  describe('evaluate — tolerancia a fallos', () => {
    it('no lanza excepción si mongoAudit falla', async () => {
      const { service } = await buildService({
        countLoginFailures: vi.fn().mockRejectedValue(new Error('Mongo timeout')),
      });
      await expect(
        service.evaluate({ accion: 'LOGIN', entidad: 'auth', resultado: 'ERROR', ip_origen: '1.1.1.1' }),
      ).resolves.not.toThrow();
    });
  });
});
