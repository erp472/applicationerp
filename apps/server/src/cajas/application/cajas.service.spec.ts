import { describe, it, expect, vi } from 'vitest';
import {
  CajaNoEncontradaError,
  CajaPadreNoEncontradaError,
  SesionNoEncontradaError,
  CajaYaAbiertaError,
  BasePuntoInsuficienteError,
} from '../domain/caja.errors.js';

// ─── Fábrica de mocks ─────────────────────────────────────────────────────────

function makeCaja(overrides = {}) {
  return {
    id: 1, codigo: 'CAJ-001', nombre: 'Caja 1', tipo: 'pos' as const,
    sucursalId: 5, cajaPadreId: 10, baseDia: '200000', limiteAlerta: '50000',
    cajeroFijoId: null, activo: true, ...overrides,
  };
}

function makePadre(overrides = {}) {
  return {
    id: 10, nombre: 'Punto Principal', sucursalId: 5,
    baseGeneral: '500000', horaReset: '06:00', supervisorId: null, ...overrides,
  };
}

function makeSesion(overrides = {}) {
  return {
    id: 20, cajaId: 1, estado: 'abierta' as const,
    usuarioAperturaId: 99, cajeroAsignadoId: 99,
    montoApertura: '100000', equipoMac: null, ...overrides,
  };
}

async function buildService(overrides: {
  cajasRepo?:   Partial<Record<string, ReturnType<typeof vi.fn>>>;
  sesionesRepo?: Partial<Record<string, ReturnType<typeof vi.fn>>>;
  realtime?:    Partial<Record<string, ReturnType<typeof vi.fn>>>;
  prisma?:      Partial<Record<string, unknown>>;
  audit?:       Partial<Record<string, ReturnType<typeof vi.fn>>>;
} = {}) {
  const { CajasService } = await import('./cajas.service.js');

  const cajasRepo = {
    findBySucursal:           vi.fn().mockResolvedValue([]),
    findById:                 vi.fn().mockResolvedValue(null),
    findAllPadres:            vi.fn().mockResolvedValue([]),
    findPadreById:            vi.fn().mockResolvedValue(null),
    findPadreBySucursal:      vi.fn().mockResolvedValue(null),
    findCajaGeneralByPadre:   vi.fn().mockResolvedValue(null),
    findByPadre:              vi.fn().mockResolvedValue([]),
    createCaja:               vi.fn().mockResolvedValue(makeCaja()),
    updateCaja:               vi.fn().mockResolvedValue(makeCaja()),
    deleteCaja:               vi.fn().mockResolvedValue(undefined),
    createPadre:              vi.fn().mockResolvedValue(makePadre()),
    updatePadre:              vi.fn().mockResolvedValue(makePadre()),
    deletePadre:              vi.fn().mockResolvedValue(undefined),
    ...overrides.cajasRepo,
  };

  const sesionesRepo = {
    findById:                     vi.fn().mockResolvedValue(null),
    findAbiertaByCaja:            vi.fn().mockResolvedValue(null),
    findAbiertaByCajero:          vi.fn().mockResolvedValue(null),
    findAbiertasByPunto:          vi.fn().mockResolvedValue([]),
    calcularSaldo:                vi.fn().mockResolvedValue('100000'),
    crearSesion:                  vi.fn().mockResolvedValue(makeSesion()),
    getMovimientos:               vi.fn().mockResolvedValue([]),
    getStatusPunto:               vi.fn().mockResolvedValue({ cajas: [] }),
    registrarMovimiento:          vi.fn().mockResolvedValue({}),
    registrarMovimientosAtomicos: vi.fn().mockResolvedValue([{}]),
    registrarTransferenciaAtomica: vi.fn().mockResolvedValue([]),
    ...overrides.sesionesRepo,
  };

  const realtime = {
    broadcast: vi.fn(),
    ...overrides.realtime,
  };

  const prisma = {
    franquiciaSucursal: { findFirst: vi.fn().mockResolvedValue(null) },
    ...overrides.prisma,
  };

  const audit = {
    log: vi.fn().mockResolvedValue(undefined),
    ...overrides.audit,
  };

  const service = new (CajasService as never)(
    cajasRepo, sesionesRepo, realtime, prisma, audit,
  ) as InstanceType<typeof CajasService>;

  return { service, cajasRepo, sesionesRepo, realtime };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CajasService', () => {

  // ── getCaja ─────────────────────────────────────────────────────────────────

  describe('getCaja', () => {
    it('lanza CajaNoEncontradaError si la caja no existe', async () => {
      const { service } = await buildService();
      await expect(service.getCaja(999)).rejects.toThrow(CajaNoEncontradaError);
    });

    it('retorna la caja si existe', async () => {
      const caja = makeCaja();
      const { service } = await buildService({
        cajasRepo: { findById: vi.fn().mockResolvedValue(caja) },
      });
      const result = await service.getCaja(1);
      expect(result).toEqual(caja);
    });
  });

  // ── listCajas ────────────────────────────────────────────────────────────────

  describe('listCajas', () => {
    it('retorna las cajas de la sucursal', async () => {
      const cajas = [makeCaja(), makeCaja({ id: 2, codigo: 'CAJ-002' })];
      const { service } = await buildService({
        cajasRepo: { findBySucursal: vi.fn().mockResolvedValue(cajas) },
      });
      const result = await service.listCajas(5);
      expect(result).toHaveLength(2);
    });
  });

  // ── getCajaPadre ─────────────────────────────────────────────────────────────

  describe('getCajaPadre', () => {
    it('lanza CajaPadreNoEncontradaError si no existe', async () => {
      const { service } = await buildService();
      await expect(service.getCajaPadre(999)).rejects.toThrow(CajaPadreNoEncontradaError);
    });

    it('retorna el punto si existe', async () => {
      const padre = makePadre();
      const { service } = await buildService({
        cajasRepo: { findPadreById: vi.fn().mockResolvedValue(padre) },
      });
      const result = await service.getCajaPadre(10);
      expect(result).toEqual(padre);
    });
  });

  // ── deleteCaja ────────────────────────────────────────────────────────────────

  describe('deleteCaja', () => {
    it('lanza CajaNoEncontradaError si no existe', async () => {
      const { service } = await buildService();
      await expect(service.deleteCaja(999)).rejects.toThrow(CajaNoEncontradaError);
    });

    it('elimina la caja si existe', async () => {
      const { service, cajasRepo } = await buildService({
        cajasRepo: { findById: vi.fn().mockResolvedValue(makeCaja()) },
      });
      await service.deleteCaja(1);
      expect(cajasRepo.deleteCaja).toHaveBeenCalledWith(1);
    });
  });

  // ── getStatusPunto ────────────────────────────────────────────────────────────

  describe('getStatusPunto', () => {
    it('delega en sesionesRepo.getStatusPunto', async () => {
      const status = { cajaPadreId: 10, cajas: [] };
      const { service, sesionesRepo } = await buildService({
        sesionesRepo: { getStatusPunto: vi.fn().mockResolvedValue(status) },
      });
      const result = await service.getStatusPunto(10);
      expect(result).toEqual(status);
      expect(sesionesRepo.getStatusPunto).toHaveBeenCalledWith(10);
    });
  });

  describe('getStatusPuntoBySucursal', () => {
    it('retorna panel vacío si no hay punto configurado en la sucursal', async () => {
      const { service } = await buildService();
      const result = await service.getStatusPuntoBySucursal(99);
      expect(result.cajaPadreId).toBe(0);
      expect(result.cajas).toEqual([]);
    });

    it('delega en getStatusPunto cuando hay punto', async () => {
      const status = { cajaPadreId: 10, cajas: [makeCaja()] };
      const { service } = await buildService({
        cajasRepo:    { findPadreBySucursal: vi.fn().mockResolvedValue(makePadre()) },
        sesionesRepo: { getStatusPunto: vi.fn().mockResolvedValue(status) },
      });
      const result = await service.getStatusPuntoBySucursal(5);
      expect(result).toEqual(status);
    });
  });

  // ── getMovimientos ────────────────────────────────────────────────────────────

  describe('getMovimientos', () => {
    it('lanza SesionNoEncontradaError si la sesión no existe', async () => {
      const { service } = await buildService();
      await expect(service.getMovimientos(999)).rejects.toThrow(SesionNoEncontradaError);
    });

    it('retorna los movimientos de la sesión', async () => {
      const movs = [{ id: 1, tipo: 'apertura', monto: '100000' }];
      const { service } = await buildService({
        sesionesRepo: {
          findById:       vi.fn().mockResolvedValue(makeSesion()),
          getMovimientos: vi.fn().mockResolvedValue(movs),
        },
      });
      const result = await service.getMovimientos(20);
      expect(result).toEqual(movs);
    });
  });

  // ── getSesionActivaByCaja ─────────────────────────────────────────────────────

  describe('getSesionActivaByCaja', () => {
    it('lanza CajaNoEncontradaError si la caja no existe', async () => {
      const { service } = await buildService();
      await expect(service.getSesionActivaByCaja(999)).rejects.toThrow(CajaNoEncontradaError);
    });

    it('retorna null si no hay sesión abierta', async () => {
      const { service } = await buildService({
        cajasRepo: { findById: vi.fn().mockResolvedValue(makeCaja()) },
      });
      const result = await service.getSesionActivaByCaja(1);
      expect(result).toBeNull();
    });

    it('retorna la sesión con saldo y alertas cuando está abierta', async () => {
      const sesion = makeSesion();
      const { service } = await buildService({
        cajasRepo: { findById: vi.fn().mockResolvedValue(makeCaja()) },
        sesionesRepo: {
          findAbiertaByCaja: vi.fn().mockResolvedValue(sesion),
          calcularSaldo:     vi.fn().mockResolvedValue('80000'),
        },
      });
      const result = await service.getSesionActivaByCaja(1);
      expect(result).not.toBeNull();
      expect(result!.saldoActual).toBe('80000');
      expect(result!.sucursalId).toBe(5);
    });
  });

  // ── abrirSesionPrincipal ──────────────────────────────────────────────────────

  describe('abrirSesionPrincipal', () => {
    it('lanza CajaPadreNoEncontradaError si no existe el punto', async () => {
      const { service } = await buildService();
      await expect(
        service.abrirSesionPrincipal(999, { montoApertura: '100000' }, 1),
      ).rejects.toThrow(CajaPadreNoEncontradaError);
    });

    it('lanza CajaNoEncontradaError si no hay caja fuerte configurada', async () => {
      const { service } = await buildService({
        cajasRepo: { findPadreById: vi.fn().mockResolvedValue(makePadre()) },
      });
      await expect(
        service.abrirSesionPrincipal(10, { montoApertura: '100000' }, 1),
      ).rejects.toThrow(CajaNoEncontradaError);
    });

    it('lanza CajaYaAbiertaError si ya existe sesión abierta', async () => {
      const { service } = await buildService({
        cajasRepo: {
          findPadreById:          vi.fn().mockResolvedValue(makePadre()),
          findCajaGeneralByPadre: vi.fn().mockResolvedValue(makeCaja({ tipo: 'general' })),
        },
        sesionesRepo: {
          findAbiertaByCaja: vi.fn().mockResolvedValue(makeSesion()),
        },
      });
      await expect(
        service.abrirSesionPrincipal(10, { montoApertura: '100000' }, 1),
      ).rejects.toThrow(CajaYaAbiertaError);
    });

    it('abre la sesión principal y emite evento realtime', async () => {
      const nuevaSesion = makeSesion({ id: 21 });
      const { service, sesionesRepo, realtime } = await buildService({
        cajasRepo: {
          findPadreById:          vi.fn().mockResolvedValue(makePadre()),
          findCajaGeneralByPadre: vi.fn().mockResolvedValue(makeCaja({ tipo: 'general' })),
        },
        sesionesRepo: {
          findAbiertaByCaja:    vi.fn().mockResolvedValue(null),
          crearSesion:          vi.fn().mockResolvedValue(nuevaSesion),
          registrarMovimiento:  vi.fn().mockResolvedValue({}),
        },
      });
      const result = await service.abrirSesionPrincipal(10, { montoApertura: '100000' }, 1);
      expect(result.id).toBe(21);
      expect(realtime.broadcast).toHaveBeenCalledWith('cajas.sesion.abierta', { cajaPadreId: 10 });
    });

    it('rechaza apertura que excede la base del punto', async () => {
      const { service } = await buildService({
        cajasRepo: {
          findPadreById:          vi.fn().mockResolvedValue(makePadre({ baseGeneral: '50000' })),
          findCajaGeneralByPadre: vi.fn().mockResolvedValue(makeCaja({ tipo: 'general' })),
        },
        sesionesRepo: {
          findAbiertaByCaja: vi.fn().mockResolvedValue(null),
        },
      });
      await expect(
        service.abrirSesionPrincipal(10, { montoApertura: '200000' }, 1),
      ).rejects.toThrow();
    });
  });

  // ── getSaldoSesion ────────────────────────────────────────────────────────────

  describe('getSaldoSesion', () => {
    it('lanza SesionNoEncontradaError si no existe', async () => {
      const { service } = await buildService();
      await expect(service.getSaldoSesion(999)).rejects.toThrow(SesionNoEncontradaError);
    });

    it('retorna saldo, alertas y detalle por medio de pago', async () => {
      const { service } = await buildService({
        cajasRepo: { findById: vi.fn().mockResolvedValue(makeCaja()) },
        sesionesRepo: {
          findById:       vi.fn().mockResolvedValue(makeSesion()),
          calcularSaldo:  vi.fn().mockResolvedValue('80000'),
          getMovimientos: vi.fn().mockResolvedValue([
            { tipo: 'apertura', medioPago: 'efectivo', monto: '80000' },
          ]),
        },
      });
      const result = await service.getSaldoSesion(20);
      expect(result.saldoActual).toBe('80000');
      expect(result.alertas).toBeDefined();
      expect(result.saldoPorMedio).toBeDefined();
    });
  });

  // ── registrarMovimientoVenta ──────────────────────────────────────────────────

  describe('registrarMovimientoVenta', () => {
    it('lanza SesionNoEncontradaError si la sesión no existe', async () => {
      const { service } = await buildService();
      await expect(
        service.registrarMovimientoVenta({
          sesionCajaId: 999, tipo: 'venta_servicio', monto: '5000',
        }),
      ).rejects.toThrow(SesionNoEncontradaError);
    });

    it('registra el movimiento y devuelve saldo actualizado', async () => {
      const movimiento = { id: 1, tipo: 'venta_servicio', monto: '5000' };
      const { service } = await buildService({
        cajasRepo: { findById: vi.fn().mockResolvedValue(makeCaja()) },
        sesionesRepo: {
          findById:                     vi.fn().mockResolvedValue(makeSesion()),
          registrarMovimientosAtomicos: vi.fn().mockResolvedValue([movimiento]),
          calcularSaldo:                vi.fn().mockResolvedValue('105000'),
        },
      });
      const result = await service.registrarMovimientoVenta({
        sesionCajaId: 20, tipo: 'venta_servicio', monto: '5000', medioPago: 'efectivo',
      });
      expect(result.movimiento).toEqual(movimiento);
      expect(result.saldoActual).toBe('105000');
    });
  });

  // ── diagnosticarPunto ─────────────────────────────────────────────────────────

  describe('diagnosticarPunto', () => {
    it('lanza CajaPadreNoEncontradaError si no existe el punto', async () => {
      const { service } = await buildService();
      await expect(service.diagnosticarPunto(999)).rejects.toThrow(CajaPadreNoEncontradaError);
    });

    it('retorna el diagnóstico del punto', async () => {
      const { service } = await buildService({
        cajasRepo: {
          findPadreById: vi.fn().mockResolvedValue(makePadre()),
          findByPadre:   vi.fn().mockResolvedValue([makeCaja()]),
        },
      });
      const result = await service.diagnosticarPunto(10);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('baseGeneral');
    });
  });

});
