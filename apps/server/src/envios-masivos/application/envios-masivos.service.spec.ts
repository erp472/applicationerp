import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { EnviosMasivosService } from './envios-masivos.service.js';
import {
  LoteNoEncontradoError,
  LoteNoEnBorradorError,
  LoteSinItemsError,
} from '../domain/envio-masivo.errors.js';

// ────────────────────────────────────────────────────────────────────────────────
// Factories de datos de prueba
// ────────────────────────────────────────────────────────────────────────────────

const makeLote = (overrides = {}) => ({
  idenvios_masivos:                     1,
  estadoenvios_masivos:                 'borrador',
  sucursales_idsucursales:              10,
  sesiones_caja_idsesiones_caja:        5,
  servicios_idservicios:                3,
  clientes_idclientes:                  null,
  remitente_nombreenvios_masivos:       'Empresa SA',
  remitente_documentoenvios_masivos:    'NIT-123',
  remitente_emailenvios_masivos:        'empresa@test.com',
  remitente_telefonoenvios_masivos:     null,
  remitente_direccionenvios_masivos:    null,
  remitente_ciudadenvios_masivos:       'Bogotá',
  remitente_cpenvios_masivos:           null,
  observacionesenvios_masivos:          null,
  total_itemsenvios_masivos:            0,
  total_peso_kgenvios_masivos:          0,
  total_estampillasenvios_masivos:      0,
  total_certificacionenvios_masivos:    0,
  valor_totalenvios_masivos:            0,
  created_atenvios_masivos:             new Date(),
  updated_atenvios_masivos:             new Date(),
  ...overrides,
});

const makeItem = (overrides = {}) => ({
  idenvios_masivos_items:                          100,
  envios_masivos_idenvios_masivos:                 1,
  numero_filaenvios_masivos_items:                 1,
  remitente_nombreenvios_masivos_items:            null,
  remitente_documentoenvios_masivos_items:         null,
  remitente_emailenvios_masivos_items:             null,
  remitente_telefonoenvios_masivos_items:          null,
  remitente_direccionenvios_masivos_items:         null,
  remitente_ciudadenvios_masivos_items:            null,
  remitente_cpenvios_masivos_items:                null,
  destinatario_nombreenvios_masivos_items:         'Juan Perez',
  destinatario_documentoenvios_masivos_items:      'CC-456',
  destinatario_emailenvios_masivos_items:          null,
  destinatario_telefonoenvios_masivos_items:       null,
  destinatario_direccionenvios_masivos_items:      'Calle 1',
  destinatario_ciudadenvios_masivos_items:         'Cali',
  destinatario_paisenvios_masivos_items:           'CO',
  destinatario_cpenvios_masivos_items:             null,
  peso_fisico_kgenvios_masivos_items:              1.5,
  peso_tarificado_kgenvios_masivos_items:          1.5,
  valor_servicioenvios_masivos_items:              8500,
  valor_estampillasenvios_masivos_items:           0,
  valor_certificacionenvios_masivos_items:         0,
  valor_totalenvios_masivos_items:                 8500,
  contenidoenvios_masivos_items:                   'Documentos',
  observacionesenvios_masivos_items:               null,
  envios_idenvios:                                 null,
  ...overrides,
});

// ────────────────────────────────────────────────────────────────────────────────
// Mock setup
// ────────────────────────────────────────────────────────────────────────────────

const mockPrisma: any = {
  $transaction: vi.fn(),
  $queryRaw:    vi.fn(),
  envioMasivo: {
    create:     vi.fn(),
    findUnique: vi.fn(),
    findMany:   vi.fn(),
    update:     vi.fn(),
    delete:     vi.fn(),
  },
  envioMasivoItem: {
    create:      vi.fn(),
    createMany:  vi.fn(),
    findUnique:  vi.fn(),
    findMany:    vi.fn(),
    findFirst:   vi.fn(),
    update:      vi.fn(),
    delete:      vi.fn(),
    deleteMany:  vi.fn(),
    aggregate:   vi.fn(),
  },
  envio: {
    create:    vi.fn(),
    findFirst: vi.fn(),
  },
  servicio: {
    findUnique: vi.fn(),
  },
};

const mockVentas = {
  cotizarEnvio:             vi.fn(),
  getCarrito:               vi.fn(),
  recalcularTotalesCarrito: vi.fn(),
};

const mockCajas = {
  getSesionActivaByCaja:     vi.fn(),
  registrarMovimientoVenta:  vi.fn(),
};

let service: EnviosMasivosService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new EnviosMasivosService(
    mockPrisma as any,
    mockVentas as any,
    mockCajas as any,
    {} as any,
  );

  // Defaults razonables para evitar repetición
  mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
  mockPrisma.$queryRaw.mockImplementation((_sql: any, cantidad: number) =>
    Promise.resolve(Array.from({ length: cantidad }, (_, i) => ({ consecutivo: BigInt(i + 1) }))),
  );
  mockCajas.getSesionActivaByCaja.mockResolvedValue({ id: 5 });
  mockVentas.getCarrito.mockResolvedValue({ id: 42, sesionCajaId: 5, total: 0 });
  mockVentas.recalcularTotalesCarrito.mockResolvedValue({ id: 42, total: 8500 });
  mockPrisma.servicio.findUnique.mockResolvedValue({ activoservicios: true, deleted_atservicios: null });
  mockPrisma.envioMasivoItem.findFirst.mockResolvedValue(null);
  mockPrisma.envioMasivoItem.aggregate.mockResolvedValue({
    _count: { idenvios_masivos_items: 1 },
    _sum: {
      peso_fisico_kgenvios_masivos_items:          1.5,
      valor_estampillasenvios_masivos_items:        0,
      valor_certificacionenvios_masivos_items:      0,
      valor_totalenvios_masivos_items:              8500,
    },
  });
  mockVentas.cotizarEnvio.mockResolvedValue({
    pesoTarificadoKg:  1.5,
    valorServicio:     8500,
    valorCertificacion: 0,
    servicio: { requiereEstampilla: false },
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// crearLote
// ────────────────────────────────────────────────────────────────────────────────

describe('crearLote', () => {
  const dto = {
    sucursalId: 10,
    cajaId:     1,
    servicioId: 3,
    remitente:  { nombre: 'Empresa SA', documento: 'NIT-123' },
  };

  it('crea el lote y retorna el registro', async () => {
    const loteCreado = makeLote();
    mockPrisma.envioMasivo.create.mockResolvedValue(loteCreado);

    const result = await service.crearLote(7, dto);

    expect(mockCajas.getSesionActivaByCaja).toHaveBeenCalledWith(dto.cajaId);
    expect(mockPrisma.envioMasivo.create).toHaveBeenCalledOnce();
    expect(result.idenvios_masivos).toBe(1);
  });

  it('lanza BadRequestException si no hay sesión activa en la caja', async () => {
    mockCajas.getSesionActivaByCaja.mockResolvedValue(null);

    await expect(service.crearLote(7, dto)).rejects.toThrow(BadRequestException);
  });

  it('persiste el usuarioId correcto en el lote', async () => {
    const loteCreado = makeLote({ usuarios_idusuarios: 42 });
    mockPrisma.envioMasivo.create.mockResolvedValue(loteCreado);

    await service.crearLote(42, dto);

    const createCall = mockPrisma.envioMasivo.create.mock.calls[0][0];
    expect(createCall.data.usuarios_idusuarios).toBe(42);
  });

  it('crea lote sin remitente global (modo multi-origen)', async () => {
    mockPrisma.envioMasivo.create.mockResolvedValue(makeLote({ remitente_nombreenvios_masivos: null }));
    const dtoSinRem = { sucursalId: 10, cajaId: 1, servicioId: 3 };

    await service.crearLote(7, dtoSinRem);

    const createCall = mockPrisma.envioMasivo.create.mock.calls[0][0];
    expect(createCall.data.remitente_nombreenvios_masivos).toBeNull();
  });

  it('lanza BadRequestException si el servicioId no existe', async () => {
    mockPrisma.servicio.findUnique.mockResolvedValue(null);
    mockPrisma.envioMasivo.create.mockResolvedValue(makeLote());

    await expect(service.crearLote(7, dto)).rejects.toThrow(BadRequestException);
  });

  it('lanza BadRequestException si el servicio está inactivo', async () => {
    mockPrisma.servicio.findUnique.mockResolvedValue({ activoservicios: false, deleted_atservicios: null });
    mockPrisma.envioMasivo.create.mockResolvedValue(makeLote());

    await expect(service.crearLote(7, dto)).rejects.toThrow(BadRequestException);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// getLote
// ────────────────────────────────────────────────────────────────────────────────

describe('getLote', () => {
  it('incluye los datos del Envio en cada item confirmado', async () => {
    const itemConEnvio = {
      ...makeItem(),
      envio: {
        numero_guiaenvios:         'GU-000100',
        estadoenvios:              'facturado',
        valor_certificacionenvios: 1800,
      },
    };
    mockPrisma.envioMasivo.findUnique.mockResolvedValue({
      ...makeLote({ estadoenvios_masivos: 'confirmado' }),
      items:    [itemConEnvio],
      servicio: { idservicios: 3, nombreservicios: 'NP-DOC-CERT', tiposervicios: 'nacional' },
    });

    const lote = await service.getLote(1);

    expect(lote.items[0].envio!.numero_guiaenvios).toBe('GU-000100');
    expect(Number(lote.items[0].envio!.valor_certificacionenvios)).toBe(1800);
  });

  it('devuelve envio = null en los items de un lote en borrador', async () => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue({
      ...makeLote(),
      items:    [{ ...makeItem(), envio: null }],
      servicio: { idservicios: 3, nombreservicios: 'NP-DOC', tiposervicios: 'nacional' },
    });

    const lote = await service.getLote(1);

    expect(lote.items[0].envio).toBeNull();
  });

  it('lanza LoteNoEncontradoError cuando el lote no existe', async () => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(null);

    await expect(service.getLote(99)).rejects.toThrow(LoteNoEncontradoError);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// agregarItem
// ────────────────────────────────────────────────────────────────────────────────

describe('agregarItem', () => {
  const dto = {
    destinatarioNombre: 'Juan Perez',
    destinatarioPais:   'CO',
    pesoFisicoKg:       1.5,
  };

  beforeEach(() => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(makeLote());
    mockPrisma.envioMasivoItem.create.mockResolvedValue(makeItem());
    mockPrisma.envioMasivoItem.update.mockResolvedValue({});
  });

  it('cotiza el envío y crea el item con datos de la cotización', async () => {
    const result = await service.agregarItem(1, dto);

    expect(mockVentas.cotizarEnvio).toHaveBeenCalledWith(
      3, 1.5, undefined, undefined, undefined, 'CO', undefined,
    );
    expect(result.cotizacion.valorServicio).toBe(8500);
    expect(result.item.idenvios_masivos_items).toBe(100);
  });

  it('asigna número de fila secuencial al primer item', async () => {
    mockPrisma.envioMasivoItem.findFirst.mockResolvedValue(null);
    mockPrisma.envioMasivoItem.create.mockResolvedValue(makeItem({ numero_filaenvios_masivos_items: 1 }));

    await service.agregarItem(1, dto);

    const createCall = mockPrisma.envioMasivoItem.create.mock.calls[0][0];
    expect(createCall.data.numero_filaenvios_masivos_items).toBe(1);
  });

  it('asigna número de fila secuencial al segundo item', async () => {
    mockPrisma.envioMasivoItem.findFirst.mockResolvedValue({ numero_filaenvios_masivos_items: 1 });
    mockPrisma.envioMasivoItem.create.mockResolvedValue(makeItem({ numero_filaenvios_masivos_items: 2 }));

    await service.agregarItem(1, dto);

    const createCall = mockPrisma.envioMasivoItem.create.mock.calls[0][0];
    expect(createCall.data.numero_filaenvios_masivos_items).toBe(2);
  });

  it('calcula estampillas cuando el servicio las requiere', async () => {
    mockVentas.cotizarEnvio.mockResolvedValue({
      pesoTarificadoKg:   1.5,
      valorServicio:      5000,
      valorCertificacion: 0,
      servicio: { requiereEstampilla: true },
    });
    mockPrisma.envioMasivoItem.create.mockResolvedValue(makeItem({
      valor_estampillasenvios_masivos_items: 5000,
    }));

    await service.agregarItem(1, dto);

    const createCall = mockPrisma.envioMasivoItem.create.mock.calls[0][0];
    expect(createCall.data.valor_estampillasenvios_masivos_items).toBe(5000);
  });

  it('persiste valorCertificacion nacional en el item', async () => {
    mockVentas.cotizarEnvio.mockResolvedValue({
      pesoTarificadoKg:   1.5,
      valorServicio:      8500,
      valorCertificacion: 1200,
      servicio: { requiereEstampilla: false },
    });
    mockPrisma.envioMasivoItem.create.mockResolvedValue(makeItem({
      valor_certificacionenvios_masivos_items: 1200,
      valor_totalenvios_masivos_items:         9700,
    }));

    const result = await service.agregarItem(1, dto);

    const createCall = mockPrisma.envioMasivoItem.create.mock.calls[0][0];
    expect(createCall.data.valor_certificacionenvios_masivos_items).toBe(1200);
    expect(createCall.data.valor_totalenvios_masivos_items).toBe(9700);
    expect(result.cotizacion.valorCertificacion).toBe(1200);
  });

  it('no aplica certificación para envíos internacionales', async () => {
    mockVentas.cotizarEnvio.mockResolvedValue({
      pesoTarificadoKg:   0.5,
      valorServicio:      25000,
      valorCertificacion: 1200,
      servicio: { requiereEstampilla: false },
    });
    mockPrisma.envioMasivoItem.create.mockResolvedValue(makeItem({
      destinatario_paisenvios_masivos_items:   'US',
      valor_certificacionenvios_masivos_items: 0,
      valor_totalenvios_masivos_items:         25000,
    }));

    await service.agregarItem(1, { ...dto, destinatarioPais: 'US' });

    const createCall = mockPrisma.envioMasivoItem.create.mock.calls[0][0];
    expect(createCall.data.valor_certificacionenvios_masivos_items).toBe(0);
    expect(createCall.data.valor_totalenvios_masivos_items).toBe(25000);
  });

  it('lanza LoteNoEnBorradorError si el lote está confirmado', async () => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(makeLote({ estadoenvios_masivos: 'confirmado' }));

    await expect(service.agregarItem(1, dto)).rejects.toThrow(LoteNoEnBorradorError);
  });

  it('lanza LoteNoEncontradoError si el lote no existe', async () => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(null);

    await expect(service.agregarItem(99, dto)).rejects.toThrow(LoteNoEncontradoError);
  });

  it('recalcula totales del lote después de agregar el item', async () => {
    await service.agregarItem(1, dto);

    expect(mockPrisma.envioMasivoItem.aggregate).toHaveBeenCalledOnce();
    expect(mockPrisma.envioMasivo.update).toHaveBeenCalledOnce();
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// agregarItems — guardado masivo transaccional
// ────────────────────────────────────────────────────────────────────────────────

describe('agregarItems', () => {
  const dto = {
    destinatarioNombre: 'Juan Perez',
    destinatarioPais:   'CO',
    pesoFisicoKg:       1.5,
  };

  beforeEach(() => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(makeLote());
    mockPrisma.envioMasivoItem.createMany.mockResolvedValue({ count: 3 });
    mockPrisma.envioMasivo.update.mockResolvedValue({});
  });

  it('inserta todas las filas en un solo createMany con un único recálculo', async () => {
    const result = await service.agregarItems(1, [dto, dto, dto]);

    expect(result).toEqual({ agregados: 3, errores: [] });
    expect(mockPrisma.envioMasivoItem.createMany).toHaveBeenCalledOnce();
    expect(mockPrisma.envioMasivoItem.createMany.mock.calls[0][0].data).toHaveLength(3);
    expect(mockPrisma.envioMasivo.update).toHaveBeenCalledOnce();
  });

  it('numera las filas consecutivamente desde la siguiente libre', async () => {
    mockPrisma.envioMasivoItem.findFirst.mockResolvedValue({ numero_filaenvios_masivos_items: 4 });

    await service.agregarItems(1, [dto, dto]);

    const filas = mockPrisma.envioMasivoItem.createMany.mock.calls[0][0].data
      .map((d: any) => d.numero_filaenvios_masivos_items);
    expect(filas).toEqual([5, 6]);
  });

  it('reporta las filas inválidas sin abortar las válidas', async () => {
    mockVentas.cotizarEnvio
      .mockResolvedValueOnce({ pesoTarificadoKg: 1.5, valorServicio: 8500, valorCertificacion: 0, servicio: { requiereEstampilla: false } })
      .mockRejectedValueOnce(new Error('Sin tarifa para 99kg'))
      .mockResolvedValueOnce({ pesoTarificadoKg: 1.5, valorServicio: 8500, valorCertificacion: 0, servicio: { requiereEstampilla: false } });

    const result = await service.agregarItems(1, [dto, { ...dto, pesoFisicoKg: 99 }, dto]);

    expect(result.agregados).toBe(2);
    expect(result.errores).toEqual([{ fila: 2, error: 'Sin tarifa para 99kg' }]);
    expect(mockPrisma.envioMasivoItem.createMany.mock.calls[0][0].data).toHaveLength(2);
  });

  it('no abre transacción ni recalcula si ninguna fila cotizó', async () => {
    mockVentas.cotizarEnvio.mockRejectedValue(new Error('Servicio inactivo'));

    const result = await service.agregarItems(1, [dto, dto]);

    expect(result.agregados).toBe(0);
    expect(result.errores).toHaveLength(2);
    expect(mockPrisma.envioMasivoItem.createMany).not.toHaveBeenCalled();
    expect(mockPrisma.envioMasivo.update).not.toHaveBeenCalled();
  });

  it('lanza LoteNoEnBorradorError si el lote ya está confirmado', async () => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(makeLote({ estadoenvios_masivos: 'confirmado' }));

    await expect(service.agregarItems(1, [dto])).rejects.toThrow(LoteNoEnBorradorError);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// confirmarLote — flujo de creación masiva de envíos
// ────────────────────────────────────────────────────────────────────────────────

describe('confirmarLote', () => {
  const LOTE_ID   = 1;
  const CAJA_ID   = 1;
  const USUARIO_ID = 7;
  const VENTA_ID  = 42;

  beforeEach(() => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(makeLote());
    mockPrisma.servicio.findUnique.mockResolvedValue({ tiposervicios: 'nacional' });
    mockPrisma.envio.findFirst.mockResolvedValue({ idenvios: 99 });
    mockPrisma.envio.create.mockResolvedValue({ idenvios: 100 });
    mockPrisma.envioMasivoItem.update.mockResolvedValue({});
    mockPrisma.envioMasivo.update.mockResolvedValue({});
    mockCajas.registrarMovimientoVenta.mockResolvedValue({
      movimiento: { id: 200 },
      saldoActual: 50000,
      alertas: [],
    });
  });

  it('crea un Envio por cada item del lote', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([
      makeItem({ numero_filaenvios_masivos_items: 1 }),
      makeItem({ idenvios_masivos_items: 101, numero_filaenvios_masivos_items: 2, destinatario_nombreenvios_masivos_items: 'Ana Torres' }),
    ]);

    const result = await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    expect(mockPrisma.envio.create).toHaveBeenCalledTimes(2);
    expect(result.enviosCreados).toBe(2);
  });

  it('usa remitente del lote cuando el item no tiene remitente propio', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([
      makeItem({ remitente_nombreenvios_masivos_items: null }),
    ]);

    await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    const createCall = mockPrisma.envio.create.mock.calls[0][0];
    expect(createCall.data.remitente_nombreenvios).toBe('Empresa SA');
  });

  it('usa remitente del item cuando está definido (tiene prioridad sobre el lote)', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([
      makeItem({ remitente_nombreenvios_masivos_items: 'Remitente Propio' }),
    ]);

    await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    const createCall = mockPrisma.envio.create.mock.calls[0][0];
    expect(createCall.data.remitente_nombreenvios).toBe('Remitente Propio');
  });

  it('lanza BadRequestException si un item no tiene remitente y el lote tampoco', async () => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(
      makeLote({ remitente_nombreenvios_masivos: null }),
    );
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([
      makeItem({ remitente_nombreenvios_masivos_items: null }),
    ]);

    await expect(
      service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('pre-valida todos los remitenttes antes de crear ningún Envío', async () => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(
      makeLote({ remitente_nombreenvios_masivos: null }),
    );
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([
      makeItem({ remitente_nombreenvios_masivos_items: 'Remitente A' }),
      makeItem({ idenvios_masivos_items: 101, numero_filaenvios_masivos_items: 2, remitente_nombreenvios_masivos_items: null }),
    ]);

    await expect(
      service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID),
    ).rejects.toThrow(BadRequestException);

    // Ningún Envío fue creado porque la validación falló antes del loop de creación
    expect(mockPrisma.envio.create).not.toHaveBeenCalled();
  });

  it('lanza LoteSinItemsError si el lote no tiene items', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([]);

    await expect(
      service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID),
    ).rejects.toThrow(LoteSinItemsError);
  });

  it('lanza BadRequestException si no hay sesión activa al confirmar', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([makeItem()]);
    mockCajas.getSesionActivaByCaja.mockResolvedValue(null);

    await expect(
      service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('propaga valorCertificacion del item al Envio creado', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([
      makeItem({ valor_certificacionenvios_masivos_items: 1200, valor_totalenvios_masivos_items: 9700 }),
    ]);

    await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    const createCall = mockPrisma.envio.create.mock.calls[0][0];
    expect(createCall.data.valor_certificacionenvios).toBe(1200);
    expect(createCall.data.valor_totalenvios).toBe(9700);
  });

  it('propaga certificacion = 0 para items sin certificación', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([
      makeItem({ valor_certificacionenvios_masivos_items: 0 }),
    ]);

    await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    const createCall = mockPrisma.envio.create.mock.calls[0][0];
    expect(createCall.data.valor_certificacionenvios).toBe(0);
  });

  it('enlaza los envíos a la venta del carrito en estado pendiente', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([makeItem()]);

    await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    const createCall = mockPrisma.envio.create.mock.calls[0][0];
    expect(createCall.data.ventas_idventas).toBe(VENTA_ID);
    expect(createCall.data.estadoenvios).toBe('pendiente');
    expect(mockCajas.registrarMovimientoVenta).not.toHaveBeenCalled();
  });

  it('recalcula el total del carrito y lo devuelve', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([makeItem()]);

    const result = await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    expect(mockVentas.recalcularTotalesCarrito).toHaveBeenCalledWith(VENTA_ID);
    expect(result.totalCarrito).toBe(8500);
  });

  it('rechaza una venta que pertenece a otra sesión de caja', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([makeItem()]);
    mockVentas.getCarrito.mockResolvedValue({ id: VENTA_ID, sesionCajaId: 99, total: 0 });

    await expect(
      service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrisma.envio.create).not.toHaveBeenCalled();
  });

  it('marca el lote como confirmado después de crear los envíos', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([makeItem()]);

    await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    expect(mockPrisma.envioMasivo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estadoenvios_masivos: 'confirmado' }),
      }),
    );
  });

  it('genera número de guía único para cada envío del lote', async () => {
    mockPrisma.envio.findFirst
      .mockResolvedValueOnce({ idenvios: 99 })
      .mockResolvedValueOnce({ idenvios: 100 });
    mockPrisma.envio.create
      .mockResolvedValueOnce({ idenvios: 100 })
      .mockResolvedValueOnce({ idenvios: 101 });

    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([
      makeItem({ numero_filaenvios_masivos_items: 1 }),
      makeItem({ idenvios_masivos_items: 101, numero_filaenvios_masivos_items: 2 }),
    ]);

    await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    const guia1 = mockPrisma.envio.create.mock.calls[0][0].data.numero_guiaenvios;
    const guia2 = mockPrisma.envio.create.mock.calls[1][0].data.numero_guiaenvios;
    expect(guia1).not.toBe(guia2);
  });

  it('devuelve el loteId, la cantidad de envíos creados y el array de guías', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([
      makeItem(),
      makeItem({ idenvios_masivos_items: 101, numero_filaenvios_masivos_items: 2 }),
      makeItem({ idenvios_masivos_items: 102, numero_filaenvios_masivos_items: 3 }),
    ]);
    mockPrisma.envio.create
      .mockResolvedValueOnce({ idenvios: 100 })
      .mockResolvedValueOnce({ idenvios: 101 })
      .mockResolvedValueOnce({ idenvios: 102 });

    const result = await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    expect(result.loteId).toBe(LOTE_ID);
    expect(result.enviosCreados).toBe(3);
    expect(result.guias).toHaveLength(3);
    expect(result.guias[0]).toMatchObject({ fila: 1, envioId: 100 });
    expect(result.guias[1]).toMatchObject({ fila: 2, envioId: 101 });
    expect(result.guias[2]).toMatchObject({ fila: 3, envioId: 102 });
  });

  it('retorna el número de guía legible para cada envío del lote', async () => {
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([
      makeItem({ numero_filaenvios_masivos_items: 1 }),
    ]);
    mockPrisma.envio.findFirst.mockResolvedValue({ idenvios: 54 });
    mockPrisma.envio.create.mockResolvedValue({ idenvios: 55 });

    const result = await service.confirmarLote(LOTE_ID, CAJA_ID, USUARIO_ID, VENTA_ID);

    expect(result.guias).toHaveLength(1);
    expect(result.guias[0].fila).toBe(1);
    expect(result.guias[0].envioId).toBe(55);
    expect(typeof result.guias[0].numeroGuia).toBe('string');
    expect(result.guias[0].numeroGuia.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// eliminarLote
// ────────────────────────────────────────────────────────────────────────────────

describe('eliminarLote', () => {
  it('elimina items y lote cuando está en borrador', async () => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(makeLote());
    mockPrisma.envioMasivoItem.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.envioMasivo.delete.mockResolvedValue({});

    await service.eliminarLote(1);

    expect(mockPrisma.envioMasivoItem.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { envios_masivos_idenvios_masivos: 1 } }),
    );
    expect(mockPrisma.envioMasivo.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idenvios_masivos: 1 } }),
    );
  });

  it('elimina el lote cuando está en estado anulado', async () => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(makeLote({ estadoenvios_masivos: 'anulado' }));
    mockPrisma.envioMasivoItem.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.envioMasivo.delete.mockResolvedValue({});

    await expect(service.eliminarLote(1)).resolves.not.toThrow();
  });

  it('lanza BadRequestException si el lote está confirmado', async () => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(makeLote({ estadoenvios_masivos: 'confirmado' }));

    await expect(service.eliminarLote(1)).rejects.toThrow(BadRequestException);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// eliminarItem
// ────────────────────────────────────────────────────────────────────────────────

describe('eliminarItem', () => {
  beforeEach(() => {
    mockPrisma.envioMasivo.findUnique.mockResolvedValue(makeLote());
    mockPrisma.envioMasivoItem.findUnique.mockResolvedValue(makeItem());
    mockPrisma.envioMasivoItem.delete.mockResolvedValue({});
    mockPrisma.envioMasivoItem.findMany.mockResolvedValue([]);
    mockPrisma.envioMasivoItem.update.mockResolvedValue({});
    mockPrisma.envioMasivo.update.mockResolvedValue({});
  });

  it('elimina el item y renumera filas', async () => {
    await service.eliminarItem(1, 100);

    expect(mockPrisma.envioMasivoItem.delete).toHaveBeenCalledWith({
      where: { idenvios_masivos_items: 100 },
    });
    expect(mockPrisma.envioMasivoItem.aggregate).toHaveBeenCalledOnce();
  });
});
