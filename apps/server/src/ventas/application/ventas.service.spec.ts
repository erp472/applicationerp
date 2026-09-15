import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import {
  VentaNoEncontradaError,
  VentaYaAnuladaError,
  ClienteNoEncontradoError,
  ProductoNoEncontradoError,
  SesionCajaInactivaError,
  ServicioNoEncontradoError,
  TarifaNoEncontradaError,
} from '../domain/venta.errors.js';

// ─── Fábrica de mocks ────────────────────────────────────────────────────────

function makeSesion(overrides = {}) {
  return { id: 10, cajaId: 1, sucursalId: 5, cajeroAsignadoId: 99, usuarioAperturaId: 99, estado: 'abierta', ...overrides };
}

function makeVenta(overrides = {}) {
  return { id: 1, estado: 'activa', sesionCajaId: 10, clienteId: 7, total: 5000, detalle: [], envios: [], apartadosPendientes: [], ...overrides };
}

function makeServicio(overrides = {}) {
  return {
    id: 3, nombre: 'NP-ORDINARIA', codigo: 'NP-ORD', tipo: 'nacional',
    requiereEstampilla: false, requiereDimensiones: false, requiereValorDeclarado: false,
    pesoMaximoKg: 30, tiempoEntregaDias: 5, tarifaCertificacion: null,
    factorVolumetrico: 5000, altoMaxCm: null, anchoMaxCm: null, largoMaxCm: null,
    minimoSeguroPostal: null, ...overrides,
  };
}

function makeTarifa(overrides = {}) {
  return { id: 1, servicioId: 3, pesoMinKg: 0, pesoMaxKg: 1, tarifa: '5000', tarifaKgAdicional: null, ciudadDestino: null, paisDestino: 'CO', tipoTrayecto: 'NACIONAL', ...overrides };
}

async function buildService(overrides: {
  repo?: Partial<Record<string, unknown>>;
  cajasService?: Partial<Record<string, unknown>>;
  inventarioService?: Partial<Record<string, unknown>>;
  audit?: Partial<Record<string, unknown>>;
  prisma?: Partial<Record<string, unknown>>;
  storage?: Partial<Record<string, unknown>>;
  realtime?: Partial<Record<string, unknown>>;
} = {}) {
  const { VentasService } = await import('./ventas.service.js');

  const repo = {
    findProductosBySucursal:        vi.fn().mockResolvedValue([]),
    findTarifasEspecial:            vi.fn().mockResolvedValue([]),
    setTarifasEspecial:             vi.fn().mockResolvedValue([]),
    findClienteByDocumento:         vi.fn().mockResolvedValue(null),
    findClienteById:                vi.fn().mockResolvedValue(null),
    findEstampillasConStock:        vi.fn().mockResolvedValue([]),
    crearVenta:                     vi.fn().mockResolvedValue({ id: 1 }),
    findVentaById:                  vi.fn().mockResolvedValue(null),
    findVentaConDetalle:            vi.fn().mockResolvedValue(null),
    agregarDetalle:                 vi.fn().mockResolvedValue({ id: 1, ventaId: 1, productoId: 1, cantidad: 1, precioUnitario: 1000 }),
    eliminarDetalle:                vi.fn().mockResolvedValue(undefined),
    findDetalleById:                vi.fn().mockResolvedValue(null),
    updateVentaTotales:             vi.fn().mockResolvedValue(undefined),
    crearEnvio:                     vi.fn().mockResolvedValue({ id: 20, numeroGuia: 'CO123456789CO' }),
    anularEnvio:                    vi.fn().mockResolvedValue(undefined),
    findEnviosPendientesByVenta:    vi.fn().mockResolvedValue([]),
    findApartadosPendientesByVenta: vi.fn().mockResolvedValue([]),
    liberarApartadoReservado:       vi.fn().mockResolvedValue(undefined),
    anularVenta:                    vi.fn().mockResolvedValue({ id: 1, estado: 'anulada' }),
    confirmarVenta:                 vi.fn().mockResolvedValue({ id: 1, estado: 'confirmada' }),
    actualizarTotales:              vi.fn().mockResolvedValue(undefined),
    findServicioById:               vi.fn().mockResolvedValue(null),
    findTarifaEnvio:                vi.fn().mockResolvedValue(null),
    findTarifasEnvioByPais:         vi.fn().mockResolvedValue([]),
    findVentasHistorico:            vi.fn().mockResolvedValue({ total: 0, datos: [] }),
    findServicioPostalBySucursal:   vi.fn().mockResolvedValue([]),
    getServiciosPostales:           vi.fn().mockResolvedValue([]),
    findNumeroGuiaSecuencia:        vi.fn().mockResolvedValue({ prefijo: 'CO', secuencia: 1 }),
    findPuntoAdmision:              vi.fn().mockResolvedValue(null),
    findEnvioById:                  vi.fn().mockResolvedValue(null),
    updateEnvio:                    vi.fn().mockResolvedValue(undefined),
    findProductoById:               vi.fn().mockResolvedValue(null),
    ...overrides.repo,
  };

  const cajasService = {
    getSesionActivaByCaja:     vi.fn().mockResolvedValue(null),
    getSaldoSesion:            vi.fn().mockResolvedValue({ saldoActual: '0', alertas: [] }),
    assertServicioActivoEnCaja: vi.fn().mockResolvedValue(undefined),
    registrarMovimientoVenta:  vi.fn().mockResolvedValue({ movimiento: {}, saldoActual: '5000', alertas: [] }),
    ...overrides.cajasService,
  };

  const inventarioService = {
    getStock:             vi.fn().mockResolvedValue(null),
    descontarInventario:  vi.fn().mockResolvedValue(undefined),
    restaurarInventario:  vi.fn().mockResolvedValue(undefined),
    ...overrides.inventarioService,
  };

  const audit = {
    log: vi.fn().mockResolvedValue(undefined),
    ...overrides.audit,
  };

  const prisma = {
    sucursal:    { findUnique: vi.fn().mockResolvedValue(null) },
    anulacion:   { create:    vi.fn().mockResolvedValue({}) },
    envioMasivo: { updateMany: vi.fn().mockResolvedValue({}) },
    ...overrides.prisma,
  };

  const storage = {
    saveFile: vi.fn().mockResolvedValue('path/to/file'),
    readFile: vi.fn().mockResolvedValue(Buffer.from('')),
    ...overrides.storage,
  };

  const realtime = {
    broadcast: vi.fn(),
    ...overrides.realtime,
  };

  const service = new (VentasService as never)(
    repo, cajasService, inventarioService, audit, prisma, storage, realtime,
  ) as InstanceType<typeof VentasService>;

  return { service, repo, cajasService, inventarioService, audit, prisma, realtime };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('VentasService', () => {

  // ── getCatalogo ─────────────────────────────────────────────────────────────

  describe('getCatalogo', () => {
    it('delega en repo.findProductosBySucursal', async () => {
      const productos = [{ id: 1, nombre: 'Sobre' }];
      const { service, repo } = await buildService({
        repo: { findProductosBySucursal: vi.fn().mockResolvedValue(productos) },
      });
      const result = await service.getCatalogo(5);
      expect(result).toEqual(productos);
      expect(repo.findProductosBySucursal).toHaveBeenCalledWith(5, undefined);
    });

    it('pasa el tipo cuando se especifica', async () => {
      const { service, repo } = await buildService();
      await service.getCatalogo(5, 'otro' as never);
      expect(repo.findProductosBySucursal).toHaveBeenCalledWith(5, 'otro');
    });
  });

  // ── getTarifasEspecial / setTarifasEspecial ─────────────────────────────────

  describe('getTarifasEspecial', () => {
    it('retorna las tarifas del producto', async () => {
      const tarifas = [{ minCantidad: 1, maxCantidad: 10, precio: 800 }];
      const { service, repo } = await buildService({
        repo: { findTarifasEspecial: vi.fn().mockResolvedValue(tarifas) },
      });
      const result = await service.getTarifasEspecial(42);
      expect(result).toEqual(tarifas);
      expect(repo.findTarifasEspecial).toHaveBeenCalledWith(42);
    });
  });

  describe('setTarifasEspecial', () => {
    it('persiste las nuevas tarifas', async () => {
      const payload = [{ minCantidad: 1, maxCantidad: null, precio: 900 }];
      const { service, repo } = await buildService({
        repo: { setTarifasEspecial: vi.fn().mockResolvedValue(payload) },
      });
      const result = await service.setTarifasEspecial(42, payload);
      expect(result).toEqual(payload);
      expect(repo.setTarifasEspecial).toHaveBeenCalledWith(42, payload);
    });
  });

  // ── buscarCliente ───────────────────────────────────────────────────────────

  describe('buscarCliente', () => {
    it('retorna el cliente encontrado', async () => {
      const cliente = { id: 7, nombre: 'Juan' };
      const { service, repo } = await buildService({
        repo: { findClienteByDocumento: vi.fn().mockResolvedValue(cliente) },
      });
      const result = await service.buscarCliente('CC', '123456789');
      expect(result).toEqual(cliente);
    });

    it('retorna null si no encuentra el cliente', async () => {
      const { service } = await buildService();
      const result = await service.buscarCliente('CC', '000');
      expect(result).toBeNull();
    });
  });

  // ── getEstampillasDisponibles ───────────────────────────────────────────────

  describe('getEstampillasDisponibles', () => {
    it('retorna [] si no hay sesión activa', async () => {
      const { service } = await buildService();
      const result = await service.getEstampillasDisponibles(1);
      expect(result).toEqual([]);
    });

    it('retorna estampillas con stock si hay sesión', async () => {
      const estampillas = [{ id: 1, denominacion: 100, stock: 5 }];
      const { service } = await buildService({
        cajasService: { getSesionActivaByCaja: vi.fn().mockResolvedValue(makeSesion()) },
        repo: { findEstampillasConStock: vi.fn().mockResolvedValue(estampillas) },
      });
      const result = await service.getEstampillasDisponibles(1);
      expect(result).toEqual(estampillas);
    });
  });

  // ── iniciarVenta ────────────────────────────────────────────────────────────

  describe('iniciarVenta', () => {
    it('lanza SesionCajaInactivaError si no hay sesión activa', async () => {
      const { service } = await buildService();
      await expect(
        service.iniciarVenta(1, { tipoDocumento: 'CC', numeroDocumento: '123' }, 99),
      ).rejects.toThrow(SesionCajaInactivaError);
    });

    it('lanza ForbiddenException si el usuario no opera la sesión', async () => {
      const { service } = await buildService({
        cajasService: { getSesionActivaByCaja: vi.fn().mockResolvedValue(makeSesion({ cajeroAsignadoId: 55, usuarioAperturaId: 55 })) },
        repo: { findClienteByDocumento: vi.fn().mockResolvedValue({ id: 7 }) },
      });
      await expect(
        service.iniciarVenta(1, { tipoDocumento: 'CC', numeroDocumento: '123' }, 99),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza ClienteNoEncontradoError si el cliente no existe', async () => {
      const { service } = await buildService({
        cajasService: { getSesionActivaByCaja: vi.fn().mockResolvedValue(makeSesion()) },
      });
      await expect(
        service.iniciarVenta(1, { tipoDocumento: 'CC', numeroDocumento: '999' }, 99),
      ).rejects.toThrow(ClienteNoEncontradoError);
    });

    it('crea la venta y retorna venta+cliente', async () => {
      const cliente = { id: 7, nombre: 'Ana' };
      const venta   = { id: 1, estado: 'activa' };
      const { service } = await buildService({
        cajasService: { getSesionActivaByCaja: vi.fn().mockResolvedValue(makeSesion()) },
        repo: {
          findClienteByDocumento: vi.fn().mockResolvedValue(cliente),
          crearVenta:             vi.fn().mockResolvedValue(venta),
        },
      });
      const result = await service.iniciarVenta(1, { tipoDocumento: 'CC', numeroDocumento: '123' }, 99);
      expect(result.venta).toEqual(venta);
      expect(result.cliente).toEqual(cliente);
    });
  });

  // ── getCarrito ──────────────────────────────────────────────────────────────

  describe('getCarrito', () => {
    it('lanza VentaNoEncontradaError si no existe', async () => {
      const { service } = await buildService();
      await expect(service.getCarrito(999)).rejects.toThrow(VentaNoEncontradaError);
    });

    it('lanza VentaYaAnuladaError si la venta está anulada', async () => {
      const { service } = await buildService({
        repo: { findVentaConDetalle: vi.fn().mockResolvedValue(makeVenta({ estado: 'anulada' })) },
      });
      await expect(service.getCarrito(1)).rejects.toThrow(VentaYaAnuladaError);
    });

    it('retorna la venta activa', async () => {
      const venta = makeVenta();
      const { service } = await buildService({
        repo: { findVentaConDetalle: vi.fn().mockResolvedValue(venta) },
      });
      const result = await service.getCarrito(1);
      expect(result).toEqual(venta);
    });
  });

  // ── eliminarProducto ────────────────────────────────────────────────────────

  describe('eliminarProducto', () => {
    it('lanza VentaNoEncontradaError si la venta no existe', async () => {
      const { service } = await buildService();
      await expect(service.eliminarProducto(999, 1)).rejects.toThrow(VentaNoEncontradaError);
    });

    it('lanza DetalleNoEncontradoError si el detalle no pertenece a esa venta', async () => {
      const { service } = await buildService({
        repo: {
          findVentaById:  vi.fn().mockResolvedValue(makeVenta()),
          findDetalleById: vi.fn().mockResolvedValue({ id: 5, ventaId: 999 }),
        },
      });
      await expect(service.eliminarProducto(1, 5)).rejects.toThrow();
    });

    it('elimina el detalle y recalcula totales', async () => {
      const { service, repo } = await buildService({
        repo: {
          findVentaById:   vi.fn().mockResolvedValue(makeVenta()),
          findDetalleById: vi.fn().mockResolvedValue({ id: 5, ventaId: 1 }),
          eliminarDetalle: vi.fn().mockResolvedValue(undefined),
          actualizarTotales: vi.fn().mockResolvedValue(undefined),
          findVentaConDetalle: vi.fn().mockResolvedValue(makeVenta()),
        },
      });
      await service.eliminarProducto(1, 5);
      expect(repo.eliminarDetalle).toHaveBeenCalledWith(5);
    });
  });

  // ── eliminarEnvioDelCarrito ─────────────────────────────────────────────────

  describe('eliminarEnvioDelCarrito', () => {
    it('lanza VentaNoEncontradaError si la venta no existe', async () => {
      const { service } = await buildService();
      await expect(service.eliminarEnvioDelCarrito(999, 20)).rejects.toThrow(VentaNoEncontradaError);
    });

    it('lanza ServicioNoEncontradoError si el envío no está pendiente', async () => {
      const { service } = await buildService({
        repo: {
          findVentaById:               vi.fn().mockResolvedValue(makeVenta()),
          findEnviosPendientesByVenta: vi.fn().mockResolvedValue([{ id: 99 }]),
        },
      });
      await expect(service.eliminarEnvioDelCarrito(1, 20)).rejects.toThrow(ServicioNoEncontradoError);
    });

    it('anula el envío correcto', async () => {
      const { service, repo } = await buildService({
        repo: {
          findVentaById:               vi.fn().mockResolvedValue(makeVenta()),
          findEnviosPendientesByVenta: vi.fn().mockResolvedValue([{ id: 20 }]),
          anularEnvio:                 vi.fn().mockResolvedValue(undefined),
          findVentaConDetalle:         vi.fn().mockResolvedValue(makeVenta()),
          actualizarTotales:           vi.fn().mockResolvedValue(undefined),
        },
      });
      await service.eliminarEnvioDelCarrito(1, 20);
      expect(repo.anularEnvio).toHaveBeenCalledWith(20);
    });
  });

  // ── anularVenta ─────────────────────────────────────────────────────────────

  describe('anularVenta', () => {
    const actor = { id: 99, rol: 'CAJERO', regional_id: null };

    it('lanza VentaNoEncontradaError si no existe', async () => {
      const { service } = await buildService();
      await expect(service.anularVenta(999, { motivo: 'test' }, 1, actor)).rejects.toThrow(VentaNoEncontradaError);
    });

    it('lanza VentaYaAnuladaError si ya estaba anulada', async () => {
      const { service } = await buildService({
        repo: { findVentaConDetalle: vi.fn().mockResolvedValue(makeVenta({ estado: 'anulada' })) },
      });
      await expect(service.anularVenta(1, { motivo: 'x' }, 1, actor)).rejects.toThrow(VentaYaAnuladaError);
    });

    it('lanza SesionCajaInactivaError si no hay sesión', async () => {
      const { service } = await buildService({
        repo: { findVentaConDetalle: vi.fn().mockResolvedValue(makeVenta()) },
      });
      await expect(service.anularVenta(1, { motivo: 'x' }, 1, actor)).rejects.toThrow(SesionCajaInactivaError);
    });

    it('anula exitosamente una venta activa (carrito no cobrado)', async () => {
      const { service, repo } = await buildService({
        repo: {
          findVentaConDetalle:         vi.fn().mockResolvedValue(makeVenta({ estado: 'activa' })),
          findEnviosPendientesByVenta: vi.fn().mockResolvedValue([]),
          findApartadosPendientesByVenta: vi.fn().mockResolvedValue([]),
          anularVenta:                 vi.fn().mockResolvedValue({ id: 1, estado: 'anulada' }),
        },
        cajasService: {
          getSesionActivaByCaja: vi.fn().mockResolvedValue(makeSesion()),
          getSaldoSesion:        vi.fn().mockResolvedValue({ saldoActual: '0', alertas: [] }),
          assertServicioActivoEnCaja: vi.fn().mockResolvedValue(undefined),
        },
        prisma: {
          sucursal:    { findUnique: vi.fn().mockResolvedValue(null) },
          anulacion:   { create:    vi.fn().mockResolvedValue({}) },
          envioMasivo: { updateMany: vi.fn().mockResolvedValue({}) },
        },
      });
      await service.anularVenta(1, { motivo: 'Error del cajero' }, 1, actor);
      expect(repo.anularVenta).toHaveBeenCalledWith(1);
    });
  });

  // ── getVentasHistorico ──────────────────────────────────────────────────────

  describe('getVentasHistorico', () => {
    const baseParams = {
      fechaInicio: '2026-01-01',
      fechaFin:    '2026-01-31',
      page: 1,
      limit: 20,
      actor: { rol: 'ADMIN_SISTEMA', sucursal_id: null, regional_id: null },
    };

    it('retorna paginación vacía cuando no hay datos', async () => {
      const { service } = await buildService();
      const result = await service.getVentasHistorico(baseParams);
      expect(result.total).toBe(0);
      expect(result.datos).toEqual([]);
      expect(result.pagina).toBe(1);
    });

    it('limita a 100 resultados por página aunque se pidan más', async () => {
      const { service, repo } = await buildService();
      await service.getVentasHistorico({ ...baseParams, limit: 500 });
      const llamada = (repo.findVentasHistorico as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(llamada.limit).toBe(100);
    });

    it('aplica filtro de regional para SUPERVISOR_REGIONAL con regional_id', async () => {
      const { service, repo } = await buildService();
      await service.getVentasHistorico({
        ...baseParams,
        actor: { rol: 'SUPERVISOR_REGIONAL', sucursal_id: null, regional_id: 3 },
      });
      const llamada = (repo.findVentasHistorico as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(llamada.regionalId).toBe(3);
      expect(llamada.sucursalId).toBeUndefined();
    });

    it('aplica filtro de sucursal para SUPERVISOR_REGIONAL sin regional_id', async () => {
      const { service, repo } = await buildService();
      await service.getVentasHistorico({
        ...baseParams,
        actor: { rol: 'SUPERVISOR_REGIONAL', sucursal_id: 7, regional_id: null },
      });
      const llamada = (repo.findVentasHistorico as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(llamada.sucursalId).toBe(7);
    });

    it('calcula totalPaginas correctamente', async () => {
      const { service } = await buildService({
        repo: { findVentasHistorico: vi.fn().mockResolvedValue({ total: 45, datos: [] }) },
      });
      const result = await service.getVentasHistorico({ ...baseParams, limit: 20 });
      expect(result.totalPaginas).toBe(3);
    });
  });

  // ── cotizarEnvio ────────────────────────────────────────────────────────────

  describe('cotizarEnvio', () => {
    it('lanza ServicioNoEncontradoError si el servicio no existe', async () => {
      const { service } = await buildService({
        repo: { findServicioById: vi.fn().mockResolvedValue(null) },
      });
      await expect(service.cotizarEnvio(999, 0.5)).rejects.toThrow(ServicioNoEncontradoError);
    });

    it('lanza TarifaNoEncontradaError si no hay tarifa para el peso', async () => {
      const { service } = await buildService({
        repo: {
          findServicioById:  vi.fn().mockResolvedValue(makeServicio()),
          findTarifaEnvio:   vi.fn().mockResolvedValue(null),
        },
      });
      await expect(service.cotizarEnvio(3, 0.5)).rejects.toThrow(TarifaNoEncontradaError);
    });

    it('calcula correctamente el valor de un envío nacional simple', async () => {
      const { service } = await buildService({
        repo: {
          findServicioById: vi.fn().mockResolvedValue(makeServicio()),
          findTarifaEnvio:  vi.fn().mockResolvedValue(makeTarifa({ tarifa: '5000' })),
        },
      });
      const result = await service.cotizarEnvio(3, 0.5);
      expect(result.valorServicio).toBe(5000);
      expect(result.pesoTarificadoKg).toBe(0.5);
    });

    it('usa tarifa de la tabla UPU para envíos internacionales', async () => {
      const tarifasUpu = [
        { paisDestino: 'US', pesoMinKg: '0', pesoMaxKg: '0.5', tarifa: '25000', pesoMinKg_raw: 0, pesoMaxKg_raw: 0.5 },
      ];
      const { service } = await buildService({
        repo: {
          findServicioById:      vi.fn().mockResolvedValue(makeServicio({ tipo: 'internacional_ms' })),
          findTarifasEnvioByPais: vi.fn().mockResolvedValue(
            tarifasUpu.map(t => ({ ...t, pesoMinKg: 0, pesoMaxKg: 0.5, tarifa: '25000', paisDestino: 'US' }))
          ),
        },
      });
      const result = await service.cotizarEnvio(3, 0.3, undefined, undefined, undefined, 'US');
      expect(result.valorServicio).toBeGreaterThan(0);
    });
  });

  // ── getSaldoAFavor ──────────────────────────────────────────────────────────

  describe('getSaldoAFavor', () => {
    it('lanza ClienteNoEncontradoError si no existe el cliente', async () => {
      const { service } = await buildService({
        repo: { findClienteById: vi.fn().mockResolvedValue(null) },
      });
      await expect(service.getSaldoAFavor(999)).rejects.toThrow(ClienteNoEncontradoError);
    });

    it('retorna el saldo a favor del cliente', async () => {
      const { service } = await buildService({
        repo: { findClienteById: vi.fn().mockResolvedValue({ id: 7, saldoAFavor: 15000 }) },
      });
      const result = await service.getSaldoAFavor(7);
      expect(result.saldoAFavor).toBe(15000);
    });
  });

});
