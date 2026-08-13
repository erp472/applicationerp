import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IVentasRepository } from '../domain/venta.repository.js';
import type {
  VentaEntity,
  VentaDetalleEntity,
  ClienteResumenEntity,
  ProductoCatalogoEntity,
  MedioPagoVenta,
  TipoProducto,
} from '../domain/venta.entity.js';
import type {
  CrearVentaData,
  AgregarDetalleData,
  ConfirmarVentaData,
  UpdateVentaTotalesData,
  ContratarApartadoData,
  ReservarApartadoData,
  CrearEnvioData,
} from '../domain/venta.repository.js';
import type {
  ApartadoPostalEntity,
  ApartadoAdminItem,
  ServicioCatalogoEntity,
  TarifaEnvioEntity,
  TarifaEspecialEntity,
  EnvioEntity,
  DireccionFrecuenteEntity,
  ResumenTurno,
  TamanoApartado,
  EstadoApartado,
} from '../domain/venta.entity.js';

// ── Selects ──────────────────────────────────────────────────────────────────

const SELECT_TARIFA_ESPECIAL = {
  idtarifas_especial_cantidad:    true,
  productos_idproductos:          true,
  min_cantidadtarifas_especial:   true,
  max_cantidadtarifas_especial:   true,
  preciotarifas_especial:         true,
} satisfies Prisma.TarifaEspecialCantidadSelect;

const SELECT_VENTA = {
  idventas:                      true,
  sesiones_caja_idsesiones_caja: true,
  usuarios_idusuarios:           true,
  clientes_idclientes:           true,
  subtotalventas:                true,
  descuentoventas:               true,
  ivaventas:                     true,
  totalventas:                   true,
  medio_pagoventas:              true,
  estadoventas:                  true,
  email_factura_ventas:          true,
  created_atventas:              true,
  updated_atventas:              true,
} satisfies Prisma.VentaSelect;

const SELECT_DETALLE = {
  idventas_detalle:              true,
  ventas_idventas:               true,
  productos_idproductos:         true,
  cantidadventas_detalle:        true,
  precio_unitarioventas_detalle: true,
  descuentoventas_detalle:       true,
  subtotalventas_detalle:        true,
  producto: {
    select: { codigoproductos: true, nombreproductos: true, tipoproductos: true, porcentaje_taxproductos: true },
  },
} satisfies Prisma.VentaDetalleSelect;

const SELECT_CLIENTE = {
  idclientes:               true,
  tipo_documentoclientes:   true,
  numero_documentoclientes: true,
  nombreclientes:           true,
  apellidoclientes:         true,
  emailclientes:            true,
  telefonoclientes:         true,
} satisfies Prisma.ClienteSelect;

const SELECT_PRODUCTO = {
  idproductos:                     true,
  codigoproductos:                 true,
  nombreproductos:                 true,
  tipoproductos:                   true,
  precioproductos:                 true,
  porcentaje_taxproductos:         true,
  activoproductos:                 true,
  cantidad_minima_ventaproductos:  true,
  cantidad_maxima_ventaproductos:  true,
} satisfies Prisma.ProductoSelect;

// ── Mappers ──────────────────────────────────────────────────────────────────

type VentaRow          = Prisma.VentaGetPayload<{ select: typeof SELECT_VENTA }>;
type DetalleRow        = Prisma.VentaDetalleGetPayload<{ select: typeof SELECT_DETALLE }>;
type ClienteRow        = Prisma.ClienteGetPayload<{ select: typeof SELECT_CLIENTE }>;
type ProductoRow       = Prisma.ProductoGetPayload<{ select: typeof SELECT_PRODUCTO }>;
type TarifaEspecialRow = Prisma.TarifaEspecialCantidadGetPayload<{ select: typeof SELECT_TARIFA_ESPECIAL }>;

function toVentaEntity(row: VentaRow, detalle?: DetalleRow[]): VentaEntity {
  return {
    id:           row.idventas,
    sesionCajaId: row.sesiones_caja_idsesiones_caja,
    usuarioId:    row.usuarios_idusuarios,
    clienteId:    row.clientes_idclientes ?? null,
    subtotal:     Number(row.subtotalventas),
    descuento:    Number(row.descuentoventas),
    iva:          Number(row.ivaventas),
    total:        Number(row.totalventas),
    medioPago:    row.medio_pagoventas as MedioPagoVenta,
    estado:       row.estadoventas as VentaEntity['estado'],
    emailFactura: row.email_factura_ventas ?? null,
    createdAt:    row.created_atventas,
    updatedAt:    row.updated_atventas,
    ...(detalle !== undefined && { detalle: detalle.map(toDetalleEntity) }),
  };
}

function toDetalleEntity(row: DetalleRow): VentaDetalleEntity {
  return {
    id:             row.idventas_detalle,
    ventaId:        row.ventas_idventas,
    productoId:     row.productos_idproductos,
    cantidad:       row.cantidadventas_detalle,
    precioUnitario: Number(row.precio_unitarioventas_detalle),
    descuento:      Number(row.descuentoventas_detalle),
    subtotal:       Number(row.subtotalventas_detalle),
    nombreProducto: row.producto.nombreproductos,
    codigoProducto: row.producto.codigoproductos,
    tipoProducto:   row.producto.tipoproductos as TipoProducto,
    porcentajeTax:  Number(row.producto.porcentaje_taxproductos),
  };
}

function toClienteEntity(row: ClienteRow): ClienteResumenEntity {
  return {
    id:              row.idclientes,
    tipoDocumento:   row.tipo_documentoclientes,
    numeroDocumento: row.numero_documentoclientes,
    nombre:          row.nombreclientes,
    apellido:        row.apellidoclientes ?? null,
    email:           row.emailclientes ?? null,
    telefono:        row.telefonoclientes ?? null,
  };
}

function toApartadoEntity(row: any): ApartadoPostalEntity {
  return {
    id:                    row.idapartados_postales,
    sucursalId:            row.sucursales_idsucursales,
    numero:                row.numeroapartados_postales,
    tamano:                row.tamanoapartados_postales as TamanoApartado,
    estado:                row.estadoapartados_postales as ApartadoPostalEntity['estado'],
    clienteId:             row.clientes_idclientes ?? null,
    ventaId:               row.ventas_idventas ?? null,
    fechaInicio:           row.fecha_inicioapartados_postales ?? null,
    fechaFin:              row.fecha_finapartados_postales ?? null,
    valor:                 row.valorapartados_postales !== null ? Number(row.valorapartados_postales) : null,
    incluyeIva:            row.incluye_ivaapartados_postales,
    sesionCajaId:          row.sesiones_caja_idsesiones_caja ?? null,
    diasAlertaVencimiento: row.dias_alerta_vencimientoapartados_postales ?? 30,
  };
}

function toServicioEntity(row: any): ServicioCatalogoEntity {
  return {
    id:                    row.idservicios,
    codigo:                row.codigoservicios,
    nombre:                row.nombreservicios,
    tipo:                  row.tiposervicios,
    requiereEstampilla:    row.requiere_estampillaservicios,
    requiereDimensiones:   row.requiere_dimensionesservicios,
    requiereValorDeclarado: row.requiere_valor_declaradoservicios,
    pesoMaximoKg:          row.peso_maximo_kgservicios !== null ? Number(row.peso_maximo_kgservicios) : null,
    factorVolumetrico:     row.factor_volumetricoservicios,
    tiempoEntregaDias:     row.tiempo_entrega_diasservicios ?? null,
    tarifaCertificacion:   row.tarifa_certificacionservicios !== null && row.tarifa_certificacionservicios !== undefined
                             ? Number(row.tarifa_certificacionservicios)
                             : null,
    minimoSeguroPostal:    row.minimo_seguro_postalservicios != null ? Number(row.minimo_seguro_postalservicios) : null,
    altoMaxCm:             row.alto_max_cmservicios  != null ? Number(row.alto_max_cmservicios)  : null,
    anchoMaxCm:            row.ancho_max_cmservicios != null ? Number(row.ancho_max_cmservicios) : null,
    largoMaxCm:            row.largo_max_cmservicios != null ? Number(row.largo_max_cmservicios) : null,
  };
}

function toTarifaEntity(row: any): TarifaEnvioEntity {
  return {
    id:                row.idtarifas_servicio,
    servicioId:        row.servicios_idservicios,
    paisDestino:       row.pais_destinotarifas_servicio,
    ciudadDestino:     row.ciudad_destinotarifas_servicio ?? null,
    pesoMinKg:         Number(row.peso_min_kgtarifas_servicio),
    pesoMaxKg:         row.peso_max_kgtarifas_servicio !== null ? Number(row.peso_max_kgtarifas_servicio) : null,
    tarifa:            Number(row.tarifatarifas_servicio),
    tarifaKgAdicional: row.tarifa_kg_adicionaltarifas_servicio !== null ? Number(row.tarifa_kg_adicionaltarifas_servicio) : null,
  };
}

function toTarifaEspecialEntity(row: TarifaEspecialRow): TarifaEspecialEntity {
  return {
    id:          row.idtarifas_especial_cantidad,
    productoId:  row.productos_idproductos,
    minCantidad: row.min_cantidadtarifas_especial,
    maxCantidad: row.max_cantidadtarifas_especial ?? null,
    precio:      Number(row.preciotarifas_especial),
  };
}

function toEnvioEntity(row: any): EnvioEntity {
  return {
    id:                    row.idenvios,
    ventaId:               row.ventas_idventas ?? null,
    numeroGuia:            row.numero_guiaenvios,
    tipo:                  row.tipoenvios,
    sucursalId:            row.sucursales_idsucursales,
    sesionCajaId:          row.sesiones_caja_idsesiones_caja ?? null,
    usuarioId:             row.usuarios_idusuarios,
    clienteId:             row.clientes_idclientes ?? null,
    servicioId:            row.servicios_idservicios,
    remitenteNombre:          row.remitente_nombreenvios ?? null,
    remitenteDocumento:       row.remitente_documentoenvios ?? null,
    remitenteTelefono:        row.remitente_telefonoenvios ?? null,
    remitenteEmail:           row.remitente_emailenvios ?? null,
    remitenteDireccion:       row.remitente_direccionenvios ?? null,
    remitenteCiudad:          row.remitente_ciudadenvios ?? null,
    remitenteCodigoPostal:    row.remitente_codigo_postalenvios ?? null,
    destinatarioNombre:       row.destinatario_nombreenvios ?? null,
    destinatarioDocumento:    row.destinatario_documentoenvios ?? null,
    destinatarioTelefono:     row.destinatario_telefonoenvios ?? null,
    destinatarioEmail:        row.destinatario_emailenvios ?? null,
    destinatarioDireccion:    row.destinatario_direccionenvios ?? null,
    destinatarioCiudad:       row.destinatario_ciudadenvios ?? null,
    destinatarioCodigoPostal: row.destinatario_codigo_postalenvios ?? null,
    destinatarioPais:         row.destinatario_paisenvios,
    pesoFisicoKg:          Number(row.peso_fisico_kgenvios),
    pesoVolumetricoKg:     row.peso_volumetrico_kgenvios !== null ? Number(row.peso_volumetrico_kgenvios) : null,
    pesoTarificadoKg:      Number(row.peso_tarificado_kgenvios),
    altoCm:                row.alto_cmenvios !== null ? Number(row.alto_cmenvios) : null,
    anchoCm:               row.ancho_cmenvios !== null ? Number(row.ancho_cmenvios) : null,
    largoCm:               row.largo_cmenvios !== null ? Number(row.largo_cmenvios) : null,
    valorDeclarado:        row.valor_declaradoenvios !== null ? Number(row.valor_declaradoenvios) : null,
    valorServicio:         Number(row.valor_servicioenvios),
    valorEstampillas:      Number(row.valor_estampillasenvios),
    valorSeguro:           Number(row.valor_seguroenvios),
    valorCertificacion:    Number(row.valor_certificacionenvios ?? 0),
    valorTotal:            Number(row.valor_totalenvios),
    medioPago:             row.medio_pagoenvios ?? null,
    estado:                row.estadoenvios,
    createdAt:             row.created_atenvios,
  };
}

function toProductoEntity(row: ProductoRow & {
  inventarioSucursal?: { cantidad_actualinventario_sucursal: number; cantidad_minimainventario_sucursal: number }[]
}): ProductoCatalogoEntity {
  const inv = row.inventarioSucursal?.[0] ?? null;
  return {
    id:            row.idproductos,
    codigo:        row.codigoproductos,
    nombre:        row.nombreproductos,
    tipo:          row.tipoproductos as TipoProducto,
    precio:        Number(row.precioproductos),
    porcentajeTax: Number(row.porcentaje_taxproductos),
    activo:        row.activoproductos,
    stockActual:    inv ? inv.cantidad_actualinventario_sucursal : null,
    stockMinimo:    inv ? inv.cantidad_minimainventario_sucursal : null,
    cantidadMinima: row.cantidad_minima_ventaproductos ?? null,
    cantidadMaxima: row.cantidad_maxima_ventaproductos ?? null,
  };
}

// ── Repository ────────────────────────────────────────────────────────────────

@Injectable()
export class PrismaVentasRepository implements IVentasRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Clientes ────────────────────────────────────────────────────────────────

  async findClienteByDocumento(tipo: string, numero: string): Promise<ClienteResumenEntity | null> {
    const row = await this.prisma.cliente.findFirst({
      where: {
        tipo_documentoclientes:   tipo as any,
        numero_documentoclientes: numero,
        deleted_atclientes:       null,
      },
      select: SELECT_CLIENTE,
    });
    return row ? toClienteEntity(row) : null;
  }

  // ── Catálogo ────────────────────────────────────────────────────────────────

  async findProductosBySucursal(sucursalId: number, tipo?: TipoProducto): Promise<ProductoCatalogoEntity[]> {
    const rows = await this.prisma.producto.findMany({
      where: {
        deleted_atproductos: null,
        activoproductos:     true,
        ...(tipo && { tipoproductos: tipo }),
        productosSucursal: {
          some: { sucursales_idsucursales: sucursalId, activoproductos_sucursal: true },
        },
      },
      select: {
        ...SELECT_PRODUCTO,
        inventarioSucursal: {
          where:  { sucursales_idsucursales: sucursalId },
          select: {
            cantidad_actualinventario_sucursal: true,
            cantidad_minimainventario_sucursal: true,
          },
        },
      },
      orderBy: { nombreproductos: 'asc' },
    });
    return rows.map(toProductoEntity);
  }

  // Bug #14: cuando se pasa sucursalId, el producto debe estar activo en esa sucursal
  async findProductoById(productoId: number, sucursalId?: number): Promise<ProductoCatalogoEntity | null> {
    const row = await this.prisma.producto.findFirst({
      where: {
        idproductos:       productoId,
        activoproductos:   true,
        deleted_atproductos: null,
        ...(sucursalId !== undefined && {
          productosSucursal: {
            some: { sucursales_idsucursales: sucursalId, activoproductos_sucursal: true },
          },
        }),
      },
      select: SELECT_PRODUCTO,
    });
    return row ? toProductoEntity(row) : null;
  }

  // ── Ventas ──────────────────────────────────────────────────────────────────

  async crearVenta(data: CrearVentaData): Promise<VentaEntity> {
    const row = await this.prisma.venta.create({
      data: {
        sesiones_caja_idsesiones_caja: data.sesionCajaId,
        usuarios_idusuarios:           data.usuarioId,
        clientes_idclientes:           data.clienteId ?? null,
        subtotalventas:                0,
        descuentoventas:               0,
        ivaventas:                     0,
        totalventas:                   0,
        medio_pagoventas:              'efectivo',
        estadoventas:                  'activa',
      },
      select: SELECT_VENTA,
    });
    return toVentaEntity(row);
  }

  async findVentaById(id: number): Promise<VentaEntity | null> {
    const row = await this.prisma.venta.findFirst({
      where: { idventas: id },
      select: SELECT_VENTA,
    });
    return row ? toVentaEntity(row) : null;
  }

  async findVentaConDetalle(id: number): Promise<VentaEntity | null> {
    const row = await this.prisma.venta.findFirst({
      where: { idventas: id },
      select: {
        ...SELECT_VENTA,
        detalle:             { select: SELECT_DETALLE },
        envios:              { where: { estadoenvios: 'pendiente' as any } },
        apartadosPendientes: { where: { estadoapartados_postales: 'reservado' as any } },
      },
    });
    if (!row) return null;
    const { detalle, envios, apartadosPendientes, ...ventaRow } = row;
    const entity = toVentaEntity(ventaRow, detalle);
    entity.envios              = envios.map(toEnvioEntity);
    entity.apartadosPendientes = apartadosPendientes.map(toApartadoEntity);
    return entity;
  }

  async updateVentaTotales(id: number, data: UpdateVentaTotalesData): Promise<void> {
    await this.prisma.venta.update({
      where: { idventas: id },
      data: {
        medio_pagoventas: data.medioPago as any,
        subtotalventas:   data.subtotal,
        descuentoventas:  data.descuento,
        ivaventas:        data.iva,
        totalventas:      data.total,
        updated_atventas: new Date(),
      },
    });
  }

  async confirmarVenta(id: number, data: ConfirmarVentaData): Promise<VentaEntity> {
    const row = await this.prisma.venta.update({
      where: { idventas: id },
      data: {
        estadoventas:        'confirmada' as any,
        medio_pagoventas:    data.medioPago as any,
        updated_atventas:    new Date(),
        ...(data.emailFactura !== undefined && { email_factura_ventas: data.emailFactura }),
      },
      select: SELECT_VENTA,
    });
    return toVentaEntity(row);
  }

  async anularVenta(id: number): Promise<VentaEntity> {
    const row = await this.prisma.venta.update({
      where: { idventas: id },
      data:  { estadoventas: 'anulada', updated_atventas: new Date() },
      select: SELECT_VENTA,
    });
    return toVentaEntity(row);
  }

  async listVentasBySession(sesionCajaId: number, fecha?: Date): Promise<VentaEntity[]> {
    const inicio = fecha ? new Date(fecha.setHours(0, 0, 0, 0)) : undefined;
    const fin    = fecha ? new Date(fecha.setHours(23, 59, 59, 999)) : undefined;

    const rows = await this.prisma.venta.findMany({
      where: {
        sesiones_caja_idsesiones_caja: sesionCajaId,
        ...(inicio && fin && { created_atventas: { gte: inicio, lte: fin } }),
      },
      select:  SELECT_VENTA,
      orderBy: { created_atventas: 'desc' },
    });
    return rows.map(r => toVentaEntity(r));
  }

  async findVentasBySucursalHoy(sucursalId: number): Promise<VentaEntity[]> {
    const inicio = new Date(); inicio.setHours(0, 0, 0, 0);
    const fin    = new Date(); fin.setHours(23, 59, 59, 999);
    const rows = await this.prisma.venta.findMany({
      where: {
        sesionCaja:       { sucursales_idsucursales: sucursalId } as any,
        estadoventas:     'confirmada' as any,
        created_atventas: { gte: inicio, lte: fin },
      },
      select:  { ...SELECT_VENTA, detalle: { select: SELECT_DETALLE } },
      orderBy: { created_atventas: 'desc' },
    });
    return rows.map(r => {
      const { detalle, ...ventaRow } = r as typeof r & { detalle: Parameters<typeof toVentaEntity>[1] };
      return toVentaEntity(ventaRow, detalle);
    });
  }

  // ── Detalle / Carrito ────────────────────────────────────────────────────────

  async agregarDetalle(data: AgregarDetalleData): Promise<VentaDetalleEntity> {
    const subtotal = Math.max(0, data.precioUnitario * data.cantidad - data.descuento);
    const row = await this.prisma.ventaDetalle.create({
      data: {
        ventas_idventas:               data.ventaId,
        productos_idproductos:         data.productoId,
        cantidadventas_detalle:        data.cantidad,
        precio_unitarioventas_detalle: data.precioUnitario,
        descuentoventas_detalle:       data.descuento,
        subtotalventas_detalle:        subtotal,
      },
      select: SELECT_DETALLE,
    });
    return toDetalleEntity(row);
  }

  async eliminarDetalle(detalleId: number): Promise<void> {
    await this.prisma.ventaDetalle.delete({ where: { idventas_detalle: detalleId } });
  }

  async findDetalleById(detalleId: number): Promise<VentaDetalleEntity | null> {
    const row = await this.prisma.ventaDetalle.findFirst({
      where:  { idventas_detalle: detalleId },
      select: SELECT_DETALLE,
    });
    return row ? toDetalleEntity(row) : null;
  }

  // ── Apartado Postal ──────────────────────────────────────────────────────────

  async findApartadosDisponibles(sucursalId: number, tamano?: TamanoApartado): Promise<ApartadoPostalEntity[]> {
    const rows = await this.prisma.apartadoPostal.findMany({
      where: {
        sucursales_idsucursales: sucursalId,
        estadoapartados_postales: 'disponible',
        deleted_atapartados_postales: null,
        ...(tamano && { tamanoapartados_postales: tamano }),
      },
      orderBy: { numeroapartados_postales: 'asc' },
    });
    return rows.map(toApartadoEntity);
  }

  async findApartadoByNumero(sucursalId: number, numero: string): Promise<ApartadoPostalEntity | null> {
    const row = await this.prisma.apartadoPostal.findUnique({
      where: {
        sucursales_idsucursales_numeroapartados_postales: {
          sucursales_idsucursales: sucursalId,
          numeroapartados_postales: numero,
        },
      },
    });
    return row ? toApartadoEntity(row) : null;
  }

  async contratarApartado(data: ContratarApartadoData): Promise<ApartadoPostalEntity> {
    const row = await this.prisma.apartadoPostal.update({
      where: {
        sucursales_idsucursales_numeroapartados_postales: {
          sucursales_idsucursales: data.sucursalId,
          numeroapartados_postales: data.numero,
        },
      },
      data: {
        estadoapartados_postales:          'ocupado',
        tamanoapartados_postales:          data.tamano,
        clientes_idclientes:               data.clienteId,
        sesiones_caja_idsesiones_caja:     data.sesionCajaId,
        fecha_inicioapartados_postales:    data.fechaInicio,
        fecha_finapartados_postales:       data.fechaFin,
        valorapartados_postales:           data.monto,
        incluye_ivaapartados_postales:     data.incluyeIva,
      },
    });
    return toApartadoEntity(row);
  }

  async reservarApartado(data: ReservarApartadoData): Promise<ApartadoPostalEntity> {
    const row = await this.prisma.apartadoPostal.update({
      where: { idapartados_postales: data.apartadoId },
      data: {
        estadoapartados_postales:       'reservado',
        tamanoapartados_postales:       data.tamano,
        clientes_idclientes:            data.clienteId,
        ventas_idventas:                data.ventaId,
        sesiones_caja_idsesiones_caja:  data.sesionCajaId,
        fecha_inicioapartados_postales: data.fechaInicio,
        fecha_finapartados_postales:    data.fechaFin,
        valorapartados_postales:        data.monto,
        incluye_ivaapartados_postales:  data.incluyeIva,
      },
    });
    return toApartadoEntity(row);
  }

  async liberarApartado(id: number): Promise<ApartadoPostalEntity> {
    const row = await this.prisma.apartadoPostal.update({
      where: { idapartados_postales: id },
      data: {
        estadoapartados_postales:       'disponible',
        clientes_idclientes:            null,
        sesiones_caja_idsesiones_caja:  null,
        fecha_inicioapartados_postales: null,
        fecha_finapartados_postales:    null,
        valorapartados_postales:        null,
      },
    });
    return toApartadoEntity(row);
  }

  async liberarApartadoReservado(id: number): Promise<ApartadoPostalEntity> {
    const row = await this.prisma.apartadoPostal.update({
      where: { idapartados_postales: id },
      data: {
        estadoapartados_postales:       'disponible',
        clientes_idclientes:            null,
        ventas_idventas:                null,
        sesiones_caja_idsesiones_caja:  null,
        fecha_inicioapartados_postales: null,
        fecha_finapartados_postales:    null,
        valorapartados_postales:        null,
      },
    });
    return toApartadoEntity(row);
  }

  async finalizarApartadoReservado(id: number): Promise<ApartadoPostalEntity> {
    const row = await this.prisma.apartadoPostal.update({
      where: { idapartados_postales: id },
      data: {
        estadoapartados_postales: 'ocupado',
        ventas_idventas:          null,
      },
    });
    return toApartadoEntity(row);
  }

  async findApartadosPendientesByVenta(ventaId: number): Promise<ApartadoPostalEntity[]> {
    const rows = await this.prisma.apartadoPostal.findMany({
      where: {
        ventas_idventas:         ventaId,
        estadoapartados_postales: 'reservado' as any,
      },
    });
    return rows.map(toApartadoEntity);
  }

  async renovarApartado(id: number, data: { nuevaFechaFin: Date; monto: number; sesionCajaId: number }): Promise<ApartadoPostalEntity> {
    const row = await this.prisma.apartadoPostal.update({
      where: { idapartados_postales: id },
      data: {
        fecha_finapartados_postales:   data.nuevaFechaFin,
        valorapartados_postales:       data.monto,
        sesiones_caja_idsesiones_caja: data.sesionCajaId,
      },
    });
    return toApartadoEntity(row);
  }

  async findAllApartadosAdmin(filters: { sucursalId?: number; estado?: string; tamano?: string }): Promise<ApartadoAdminItem[]> {
    const rows = await this.prisma.apartadoPostal.findMany({
      where: {
        deleted_atapartados_postales: null,
        ...(filters.sucursalId && { sucursales_idsucursales: filters.sucursalId }),
        ...(filters.estado && { estadoapartados_postales: filters.estado as any }),
        ...(filters.tamano && { tamanoapartados_postales: filters.tamano as any }),
      },
      include: {
        sucursal: { select: { nombresucursales: true, codigosucursales: true } },
      },
      orderBy: [
        { sucursales_idsucursales: 'asc' },
        { numeroapartados_postales: 'asc' },
      ],
    });
    return rows.map((r) => ({
      ...toApartadoEntity(r),
      sucursalNombre: r.sucursal.nombresucursales,
      sucursalCodigo: r.sucursal.codigosucursales,
    }));
  }

  async findApartadoById(id: number): Promise<ApartadoPostalEntity | null> {
    const row = await this.prisma.apartadoPostal.findFirst({
      where: { idapartados_postales: id, deleted_atapartados_postales: null },
    });
    return row ? toApartadoEntity(row) : null;
  }

  async createApartado(data: {
    sucursalId: number; numero: string; tamano: TamanoApartado; diasAlertaVencimiento: number;
  }): Promise<ApartadoPostalEntity> {
    const row = await this.prisma.apartadoPostal.create({
      data: {
        sucursales_idsucursales:                  data.sucursalId,
        numeroapartados_postales:                 data.numero,
        tamanoapartados_postales:                 data.tamano,
        dias_alerta_vencimientoapartados_postales: data.diasAlertaVencimiento,
      },
    });
    return toApartadoEntity(row);
  }

  async updateApartadoAdmin(
    id: number,
    data: { tamano?: TamanoApartado; estado?: EstadoApartado; diasAlertaVencimiento?: number },
  ): Promise<ApartadoPostalEntity> {
    const row = await this.prisma.apartadoPostal.update({
      where: { idapartados_postales: id },
      data: {
        ...(data.tamano                  !== undefined && { tamanoapartados_postales: data.tamano }),
        ...(data.estado                  !== undefined && { estadoapartados_postales: data.estado }),
        ...(data.diasAlertaVencimiento   !== undefined && { dias_alerta_vencimientoapartados_postales: data.diasAlertaVencimiento }),
      },
    });
    return toApartadoEntity(row);
  }

  async deleteApartado(id: number): Promise<void> {
    await this.prisma.apartadoPostal.update({
      where: { idapartados_postales: id },
      data:  { deleted_atapartados_postales: new Date() },
    });
  }

  // ── Servicios Postales ────────────────────────────────────────────────────────

  async findServiciosBySucursal(sucursalId: number): Promise<ServicioCatalogoEntity[]> {
    const rows = await this.prisma.servicio.findMany({
      where: {
        activoservicios:   true,
        deleted_atservicios: null,
        serviciosSucursal: { some: { sucursales_idsucursales: sucursalId } },
      },
      orderBy: { nombreservicios: 'asc' },
    });
    return rows.map(toServicioEntity);
  }

  async findServicioById(servicioId: number): Promise<ServicioCatalogoEntity | null> {
    const row = await this.prisma.servicio.findFirst({
      where: { idservicios: servicioId, activoservicios: true, deleted_atservicios: null },
    });
    return row ? toServicioEntity(row) : null;
  }

  async findTarifaEnvio(servicioId: number, pesoKg: number, paisDestino: string, ciudadDestino?: string): Promise<TarifaEnvioEntity | null> {
    const pesoWhere = {
      servicios_idservicios:        servicioId,
      activatarifas_servicio:       true,
      deleted_attarifas_servicio:   null,
      pais_destinotarifas_servicio: paisDestino,
      peso_min_kgtarifas_servicio:  { lte: pesoKg },
      OR: [
        { peso_max_kgtarifas_servicio: null as null },
        { peso_max_kgtarifas_servicio: { gte: pesoKg } },
      ],
    };

    if (ciudadDestino) {
      const specific = await this.prisma.tarifaServicio.findFirst({
        where:   { ...pesoWhere, ciudad_destinotarifas_servicio: ciudadDestino },
        orderBy: { peso_min_kgtarifas_servicio: 'desc' },
      });
      if (specific) return toTarifaEntity(specific);
    }

    const row = await this.prisma.tarifaServicio.findFirst({
      where:   { ...pesoWhere, ciudad_destinotarifas_servicio: null },
      orderBy: { peso_min_kgtarifas_servicio: 'desc' },
    });
    return row ? toTarifaEntity(row) : null;
  }

  async findTarifasEnvioByPais(servicioId: number, paisDestino: string): Promise<TarifaEnvioEntity[]> {
    const rows = await this.prisma.tarifaServicio.findMany({
      where: {
        servicios_idservicios:        servicioId,
        activatarifas_servicio:       true,
        deleted_attarifas_servicio:   null,
        pais_destinotarifas_servicio: paisDestino,
        ciudad_destinotarifas_servicio: null,
      },
      orderBy: { peso_min_kgtarifas_servicio: 'asc' },
    });
    return rows.map(toTarifaEntity);
  }

  async findPaisesDestinoByServicio(servicioId: number): Promise<string[]> {
    const rows = await this.prisma.tarifaServicio.findMany({
      where: {
        servicios_idservicios:      servicioId,
        activatarifas_servicio:     true,
        deleted_attarifas_servicio: null,
      },
      select:   { pais_destinotarifas_servicio: true },
      distinct: ['pais_destinotarifas_servicio'],
      orderBy:  { pais_destinotarifas_servicio: 'asc' },
    });
    return rows.map(r => r.pais_destinotarifas_servicio);
  }

  async findEstampillasConStock(sucursalId: number): Promise<{ denominacion: string; stock: number }[]> {
    const rows = await this.prisma.producto.findMany({
      where: {
        tipoproductos:       'estampilla',
        activoproductos:     true,
        deleted_atproductos: null,
        productosSucursal:   { some: { sucursales_idsucursales: sucursalId, activoproductos_sucursal: true } },
      },
      select: {
        precioproductos: true,
        inventarioSucursal: {
          where:  { sucursales_idsucursales: sucursalId },
          select: { cantidad_actualinventario_sucursal: true },
          take:   1,
        },
      },
      orderBy: { precioproductos: 'desc' },
    });
    return rows
      .filter(r => (r.inventarioSucursal[0]?.cantidad_actualinventario_sucursal ?? 0) > 0)
      .map(r => ({
        denominacion: String(Math.round(Number(r.precioproductos))),
        stock:        r.inventarioSucursal[0]?.cantidad_actualinventario_sucursal ?? 0,
      }));
  }

  async crearEnvio(data: CrearEnvioData): Promise<EnvioEntity> {
    const row = await this.prisma.envio.create({
      data: {
        numero_guiaenvios:               data.numeroGuia,
        tipoenvios:                      data.tipo as any,
        sucursales_idsucursales:         data.sucursalId,
        sesiones_caja_idsesiones_caja:   data.sesionCajaId,
        usuarios_idusuarios:             data.usuarioId,
        clientes_idclientes:             data.clienteId ?? null,
        servicios_idservicios:           data.servicioId,
        remitente_nombreenvios:          data.remitenteNombre,
        remitente_documentoenvios:       data.remitenteDocumento ?? null,
        remitente_emailenvios:           data.remitenteEmail ?? null,
        remitente_telefonoenvios:        data.remitenteTelefono ?? null,
        remitente_direccionenvios:       data.remitenteDireccion ?? null,
        remitente_ciudadenvios:          data.remitenteCiudad ?? null,
        remitente_codigo_postalenvios:   data.remitenteCp ?? null,
        destinatario_nombreenvios:       data.destinatarioNombre,
        destinatario_documentoenvios:    data.destinatarioDocumento ?? null,
        destinatario_emailenvios:        data.destinatarioEmail ?? null,
        destinatario_telefonoenvios:     data.destinatarioTelefono ?? null,
        destinatario_direccionenvios:    data.destinatarioDireccion ?? null,
        destinatario_ciudadenvios:       data.destinatarioCiudad ?? null,
        destinatario_paisenvios:         data.destinatarioPais,
        destinatario_codigo_postalenvios: data.destinatarioCp ?? null,
        peso_fisico_kgenvios:            data.pesoFisicoKg,
        alto_cmenvios:                   data.altoCm ?? null,
        ancho_cmenvios:                  data.anchoCm ?? null,
        largo_cmenvios:                  data.largoCm ?? null,
        peso_volumetrico_kgenvios:       data.pesoVolumetricoKg ?? null,
        peso_tarificado_kgenvios:        data.pesoTarificadoKg,
        valor_declaradoenvios:           data.valorDeclarado ?? null,
        valor_servicioenvios:            data.valorServicio,
        valor_estampillasenvios:         data.valorEstampillas,
        valor_seguroenvios:              data.valorSeguro,
        valor_certificacionenvios:       data.valorCertificacion,
        valor_totalenvios:               data.valorTotal,
        medio_pagoenvios:                data.medioPago as any,
        observacionesenvios:             data.observaciones ?? null,
        es_correspondenciaenvios:        data.esCorrespondencia ?? false,
        estadoenvios:                    (data.estado ?? 'facturado') as any,
        ventas_idventas:                 data.ventaId ?? null,
      },
    });
    return toEnvioEntity(row);
  }

  async anularEnvio(id: number): Promise<EnvioEntity> {
    const row = await this.prisma.envio.update({
      where: { idenvios: id },
      data:  { estadoenvios: 'anulado', updated_atenvios: new Date() },
    });
    return toEnvioEntity(row);
  }

  async findEnviosPendientesByVenta(ventaId: number): Promise<EnvioEntity[]> {
    const rows = await this.prisma.envio.findMany({
      where: {
        ventas_idventas: ventaId,
        estadoenvios:    'pendiente' as any,
      },
    });
    return rows.map(toEnvioEntity);
  }

  async facturarEnvio(id: number): Promise<EnvioEntity> {
    const row = await this.prisma.envio.update({
      where: { idenvios: id },
      data:  { estadoenvios: 'facturado', updated_atenvios: new Date() },
    });
    return toEnvioEntity(row);
  }

  // ── Resumen de turno ──────────────────────────────────────────────────────────

  async getResumenSesion(sesionCajaId: number): Promise<ResumenTurno> {
    const grupos = await this.prisma.movimientoCaja.groupBy({
      by: ['tipomovimientos_caja'],
      where: { sesiones_caja_idsesiones_caja: sesionCajaId },
      _count: { idmovimientos_caja: true },
      _sum:   { montomovimientos_caja: true },
    });

    const get = (tipo: string) => {
      const g = grupos.find(r => r.tipomovimientos_caja === tipo);
      return {
        cantidad: g?._count.idmovimientos_caja ?? 0,
        total:    Number(g?._sum.montomovimientos_caja ?? 0),
      };
    };

    const sellos    = get('venta_estampilla');
    const productos = get('venta_producto');
    const apartados = get('apartado_postal');
    const servicios = get('venta_servicio');
    const anulaciones = get('anulacion');

    const totalGeneral =
      sellos.total + productos.total + apartados.total + servicios.total - anulaciones.total;

    return { sesionCajaId, sellos, productos, apartados, servicios, anulaciones, totalGeneral };
  }

  async findTarifasEspecial(productoId: number): Promise<TarifaEspecialEntity[]> {
    const rows = await this.prisma.tarifaEspecialCantidad.findMany({
      where: {
        productos_idproductos:       productoId,
        activotarifas_especial:      true,
        deleted_attarifas_especial:  null,
      },
      select:  SELECT_TARIFA_ESPECIAL,
      orderBy: { min_cantidadtarifas_especial: 'asc' },
    });
    return rows.map(toTarifaEspecialEntity);
  }

  async setTarifasEspecial(
    productoId: number,
    tarifas: Array<{ minCantidad: number; maxCantidad: number | null; precio: number }>,
  ): Promise<TarifaEspecialEntity[]> {
    await this.prisma.$transaction([
      this.prisma.tarifaEspecialCantidad.deleteMany({
        where: { productos_idproductos: productoId },
      }),
      this.prisma.tarifaEspecialCantidad.createMany({
        data: tarifas.map(t => ({
          productos_idproductos:         productoId,
          min_cantidadtarifas_especial:  t.minCantidad,
          max_cantidadtarifas_especial:  t.maxCantidad ?? null,
          preciotarifas_especial:        t.precio,
        })),
      }),
    ]);
    return this.findTarifasEspecial(productoId);
  }

  async nextConsecutivoGuia(): Promise<number> {
    const last = await this.prisma.envio.findFirst({
      orderBy: { idenvios: 'desc' },
      select:  { idenvios: true },
    });
    return (last?.idenvios ?? 0) + 1;
  }

  // ── Direcciones frecuentes ────────────────────────────────────────────────────

  async upsertDireccionFrecuente(data: {
    clienteId:    number;
    rol:          'remitente' | 'destinatario';
    nombre:       string;
    empresa?:     string;
    telefono?:    string;
    email?:       string;
    direccion?:   string;
    ciudad?:      string;
    departamento?: string;
    pais:         string;
    codigoPostal?: string;
    documento?:   string;
  }): Promise<void> {
    const existing = await this.prisma.direccionFrecuente.findFirst({
      where: {
        clientes_idclientes:         data.clienteId,
        roldireccionesfrecuentes:    data.rol,
        nombredireccionesfrecuentes: data.nombre,
        telefonodirfrecuentes:       data.telefono ?? null,
      },
    });
    if (existing) {
      await this.prisma.direccionFrecuente.update({
        where: { iddireccionesfrecuentes: existing.iddireccionesfrecuentes },
        data:  {
          empresadireccionesfrecuentes: data.empresa ?? null,
          emaildirfrecuentes:           data.email ?? null,
          direcciondirfrecuentes:       data.direccion ?? null,
          ciudaddirfrecuentes:          data.ciudad ?? null,
          departamentodirfrecuentes:    data.departamento ?? null,
          paisdirfrecuentes:            data.pais,
          codigo_postaldirfrecuentes:   data.codigoPostal ?? null,
          documentodirfrecuentes:       data.documento ?? null,
          usosdirfrecuentes:            { increment: 1 },
          ultimo_usodirfrecuentes:      new Date(),
        },
      });
    } else {
      await this.prisma.direccionFrecuente.create({
        data: {
          clientes_idclientes:          data.clienteId,
          roldireccionesfrecuentes:     data.rol,
          nombredireccionesfrecuentes:  data.nombre,
          empresadireccionesfrecuentes: data.empresa ?? null,
          telefonodirfrecuentes:        data.telefono ?? null,
          emaildirfrecuentes:           data.email ?? null,
          direcciondirfrecuentes:       data.direccion ?? null,
          ciudaddirfrecuentes:          data.ciudad ?? null,
          departamentodirfrecuentes:    data.departamento ?? null,
          paisdirfrecuentes:            data.pais,
          codigo_postaldirfrecuentes:   data.codigoPostal ?? null,
          documentodirfrecuentes:       data.documento ?? null,
        },
      });
    }
  }

  private _mapDireccion(r: {
    iddireccionesfrecuentes:      number;
    clientes_idclientes:          number;
    roldireccionesfrecuentes:     string;
    nombredireccionesfrecuentes:  string;
    empresadireccionesfrecuentes: string | null;
    telefonodirfrecuentes:        string | null;
    emaildirfrecuentes:           string | null;
    direcciondirfrecuentes:       string | null;
    ciudaddirfrecuentes:          string | null;
    departamentodirfrecuentes:    string | null;
    paisdirfrecuentes:            string;
    codigo_postaldirfrecuentes:   string | null;
    documentodirfrecuentes:       string | null;
    usosdirfrecuentes:            number;
    ultimo_usodirfrecuentes:      Date;
  }): DireccionFrecuenteEntity {
    return {
      id:           r.iddireccionesfrecuentes,
      clienteId:    r.clientes_idclientes,
      rol:          r.roldireccionesfrecuentes as 'remitente' | 'destinatario',
      nombre:       r.nombredireccionesfrecuentes,
      empresa:      r.empresadireccionesfrecuentes,
      telefono:     r.telefonodirfrecuentes,
      email:        r.emaildirfrecuentes,
      direccion:    r.direcciondirfrecuentes,
      ciudad:       r.ciudaddirfrecuentes,
      departamento: r.departamentodirfrecuentes,
      pais:         r.paisdirfrecuentes,
      codigoPostal: r.codigo_postaldirfrecuentes,
      documento:    r.documentodirfrecuentes,
      usos:         r.usosdirfrecuentes,
      ultimoUso:    r.ultimo_usodirfrecuentes,
    };
  }

  async findDireccionesFrecuentes(
    clienteId: number,
    rol?: 'remitente' | 'destinatario',
  ): Promise<DireccionFrecuenteEntity[]> {
    const rows = await this.prisma.direccionFrecuente.findMany({
      where: {
        clientes_idclientes:      clienteId,
        ...(rol ? { roldireccionesfrecuentes: rol } : {}),
      },
      orderBy: [
        { usosdirfrecuentes:       'desc' },
        { ultimo_usodirfrecuentes: 'desc' },
      ],
      take: 30,
    });
    return rows.map((r) => this._mapDireccion(r));
  }

  async findDireccionesPorDocumento(
    documento: string,
    rol?: 'remitente' | 'destinatario',
  ): Promise<DireccionFrecuenteEntity[]> {
    const rows = await this.prisma.direccionFrecuente.findMany({
      where: {
        documentodirfrecuentes:   documento,
        ...(rol ? { roldireccionesfrecuentes: rol } : {}),
      },
      orderBy: [
        { usosdirfrecuentes:       'desc' },
        { ultimo_usodirfrecuentes: 'desc' },
      ],
      take: 30,
    });
    return rows.map((r) => this._mapDireccion(r));
  }
}
