import { Injectable, Inject, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { CajasService }   from '../../cajas/application/cajas.service.js';
import { AuditService }   from '../../audit/audit.service.js';
import { auditStore }     from '../../common/audit-context.js';
import { VENTAS_REPOSITORY } from '../domain/venta.repository.js';
import type { IVentasRepository } from '../domain/venta.repository.js';
import type { TipoProducto } from '../domain/venta.entity.js';
import {
  VentaNoEncontradaError,
  ClienteNoEncontradoError,
  ProductoNoEncontradoError,
  DetalleNoEncontradoError,
  SesionCajaInactivaError,
  ApartadoNoDisponibleError,
  ApartadoNoEncontradoError,
  ServicioNoEncontradoError,
  TarifaNoEncontradaError,
  StockInsuficienteError,
  CantidadMinimaError,
  CantidadMaximaError,
} from '../domain/venta.errors.js';
import {
  validarSesionActivaParaVenta,
  validarCarritoNoVacio,
  validarVentaActiva,
  validarVentaEnSesion,
  calcularSubtotalDetalle,
  calcularTotalesCarrito,
} from '../domain/business-rules.js';
import type { IniciarVentaDto }       from '../dto/iniciar-venta.dto.js';
import type { AgregarProductoDto }    from '../dto/agregar-producto.dto.js';
import type { ConfirmarVentaDto }     from '../dto/confirmar-venta.dto.js';
import type { AnularVentaDto }        from '../dto/anular-venta.dto.js';
import type { ContratarApartadoDto }       from '../dto/contratar-apartado.dto.js';
import type { CrearApartadoAdminDto }       from '../dto/crear-apartado-admin.dto.js';
import type { UpdateApartadoAdminDto }      from '../dto/update-apartado-admin.dto.js';
import type { CrearEnvioDto }         from '../dto/crear-envio.dto.js';

@Injectable()
export class VentasService {
  constructor(
    @Inject(VENTAS_REPOSITORY)
    private readonly repo: IVentasRepository,
    private readonly cajasService: CajasService,
    private readonly audit: AuditService,
  ) {}

  // ── Catálogo ─────────────────────────────────────────────────────────────────

  async getCatalogo(sucursalId: number, tipo?: TipoProducto) {
    return this.repo.findProductosBySucursal(sucursalId, tipo);
  }

  async getTarifasEspecial(productoId: number) {
    return this.repo.findTarifasEspecial(productoId);
  }

  // ── Buscar cliente ────────────────────────────────────────────────────────────

  async buscarCliente(tipo: string, numero: string) {
    return this.repo.findClienteByDocumento(tipo, numero);
  }

  // ── Iniciar venta ─────────────────────────────────────────────────────────────

  async iniciarVenta(cajaId: number, dto: IniciarVentaDto, usuarioId: number, userRol: string) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    validarSesionActivaParaVenta(cajaId, sesion?.id ?? null);

    // CAJERO solo puede operar la caja que le fue asignada
    if (userRol === 'CAJERO' && sesion!.cajeroAsignadoId !== null && sesion!.cajeroAsignadoId !== usuarioId) {
      throw new ForbiddenException('Esta caja está asignada a otro cajero');
    }

    const cliente = await this.repo.findClienteByDocumento(dto.tipoDocumento, dto.numeroDocumento);
    if (!cliente) throw new ClienteNoEncontradoError(dto.tipoDocumento, dto.numeroDocumento);

    const venta = await this.repo.crearVenta({
      sesionCajaId: sesion!.id,
      usuarioId,
      clienteId: cliente.id,
    });

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      accion: 'CREATE', entidad: 'venta', entidad_id: venta.id, usuario_id: userId, ip_origen: ip,
      datos_despues: { clienteId: cliente.id, sesionCajaId: sesion!.id, cajaId },
    });

    return { venta, cliente };
  }

  // ── Carrito ───────────────────────────────────────────────────────────────────

  async getCarrito(ventaId: number) {
    const venta = await this.repo.findVentaConDetalle(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);
    return venta;
  }

  async agregarProducto(ventaId: number, dto: AgregarProductoDto, cajaId: number) {
    const venta = await this.repo.findVentaById(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);

    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);
    validarVentaEnSesion(ventaId, venta.sesionCajaId, sesion.id);

    const producto = await this.repo.findProductoById(dto.productoId);
    if (!producto) throw new ProductoNoEncontradoError(dto.productoId);

    // Validar límites de cantidad para servicios especiales (tipo='otro')
    if (producto.tipo === 'otro') {
      if (producto.cantidadMinima !== null && dto.cantidad < producto.cantidadMinima) {
        throw new CantidadMinimaError(producto.nombre, producto.cantidadMinima);
      }
      if (producto.cantidadMaxima !== null && dto.cantidad > producto.cantidadMaxima) {
        throw new CantidadMaximaError(producto.nombre, producto.cantidadMaxima);
      }
    }

    let precioUnitario = producto.precio;
    if (producto.tipo === 'otro') {
      const tarifas = await this.repo.findTarifasEspecial(dto.productoId);
      if (tarifas.length > 0) {
        const tarifa = tarifas.find(t =>
          dto.cantidad >= t.minCantidad && (t.maxCantidad === null || dto.cantidad <= t.maxCantidad)
        );
        if (tarifa) precioUnitario = tarifa.precio;
      }
    }

    const subtotal = calcularSubtotalDetalle(precioUnitario, dto.cantidad, dto.descuento);

    const detalle = await this.repo.agregarDetalle({
      ventaId,
      productoId:     dto.productoId,
      cantidad:       dto.cantidad,
      precioUnitario,
      descuento:      dto.descuento,
    });

    await this._recalcularTotales(ventaId);

    return { detalle: { ...detalle, subtotal }, nombreProducto: producto.nombre };
  }

  async eliminarProducto(ventaId: number, detalleId: number) {
    const venta = await this.repo.findVentaById(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);

    const detalle = await this.repo.findDetalleById(detalleId);
    if (!detalle || detalle.ventaId !== ventaId) throw new DetalleNoEncontradoError(detalleId);

    await this.repo.eliminarDetalle(detalleId);
    await this._recalcularTotales(ventaId);
  }

  // ── Confirmar venta ───────────────────────────────────────────────────────────

  async confirmarVenta(ventaId: number, dto: ConfirmarVentaDto, cajaId: number, usuarioId: number) {
    const venta = await this.repo.findVentaConDetalle(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);
    validarCarritoNoVacio(venta.detalle?.length ?? 0);

    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);
    validarVentaEnSesion(ventaId, venta.sesionCajaId, sesion.id);

    // Validar stock de servicios especiales antes de confirmar
    const itemsServicio = (venta.detalle ?? []).filter(d => d.tipoProducto === 'otro');
    for (const item of itemsServicio) {
      const stock = await this.repo.getStockActual(item.productoId, sesion.sucursalId);
      if (stock !== null && stock < item.cantidad) {
        throw new StockInsuficienteError(item.nombreProducto ?? `producto ${item.productoId}`, stock, item.cantidad);
      }
    }

    const ventaActualizada = await this.repo.confirmarVenta(ventaId, {
      medioPago:        dto.medioPago,
      efectivoRecibido: dto.efectivoRecibido,
      emailFactura:     dto.emailFactura,
    });

    // Descontar inventario para cada servicio especial (validación atómica dentro de la transacción)
    for (const item of itemsServicio) {
      try {
        await this.repo.descontarInventario({
          productoId: item.productoId,
          sucursalId: sesion.sucursalId,
          cantidad:   item.cantidad,
          ventaId,
          usuarioId,
        });
      } catch (err: unknown) {
        if ((err as { code?: string }).code === 'STOCK_INSUFICIENTE') {
          const e = err as { stockActual: number; cantidadRequerida: number };
          throw new StockInsuficienteError(
            item.nombreProducto ?? `producto ${item.productoId}`,
            e.stockActual,
            e.cantidadRequerida,
          );
        }
        throw err;
      }
    }

    // Determinar el tipo de movimiento según los productos de la venta
    const tipoMovimiento = this._resolverTipoMovimiento(venta.detalle ?? []);

    const { movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           tipoMovimiento,
      monto:          String(venta.total),
      medioPago:      dto.medioPago as any,
      referenciaId:   ventaId,
      referenciaTipo: 'Venta',
    });

    const cambio = dto.medioPago === 'efectivo' && dto.efectivoRecibido
      ? Math.max(0, dto.efectivoRecibido - venta.total)
      : 0;

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      accion: 'UPDATE', entidad: 'venta', entidad_id: ventaId, usuario_id: userId, ip_origen: ip,
      datos_despues: {
        evento:    'confirmar_pago',
        total:     venta.total,
        medioPago: dto.medioPago,
        email:     dto.emailFactura,
        cambio,
        sesionCajaId: sesion!.id,
        cajaId,
      },
    });

    return { venta: ventaActualizada, movimiento, saldoActual, alertas, cambio };
  }

  // ── Anular venta ──────────────────────────────────────────────────────────────

  async anularVenta(ventaId: number, dto: AnularVentaDto, cajaId: number, usuarioId: number) {
    const venta = await this.repo.findVentaConDetalle(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);

    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);
    validarVentaEnSesion(ventaId, venta.sesionCajaId, sesion.id);

    const ventaAnulada = await this.repo.anularVenta(ventaId);

    // Restaurar inventario de servicios especiales anulados
    const itemsServicio = (venta.detalle ?? []).filter(d => d.tipoProducto === 'otro');
    for (const item of itemsServicio) {
      await this.repo.restaurarInventario({
        productoId: item.productoId,
        sucursalId: sesion.sucursalId,
        cantidad:   item.cantidad,
        ventaId,
        usuarioId,
      });
    }

    const { movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           'anulacion',
      monto:          String(venta.total),
      referenciaId:   ventaId,
      referenciaTipo: 'Venta',
    });

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      accion: 'UPDATE', entidad: 'venta', entidad_id: ventaId, usuario_id: userId, ip_origen: ip,
      datos_despues: {
        evento:   'anular_venta',
        motivo:   dto.motivo,
        total:    venta.total,
        sesionCajaId: sesion!.id,
        cajaId,
      },
    });

    return { venta: ventaAnulada, movimiento, saldoActual, alertas, motivo: dto.motivo };
  }

  // ── Listado de ventas del turno ───────────────────────────────────────────────

  async listMovimientosTurno(cajaId: number) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);
    return this.cajasService.getMovimientos(sesion.id);
  }

  // ── Apartado Postal ───────────────────────────────────────────────────────────

  async getApartadosDisponibles(sucursalId: number, tamano?: string) {
    return this.repo.findApartadosDisponibles(sucursalId, tamano as any);
  }

  async getServiciosPostales(sucursalId: number) {
    return this.repo.findServiciosBySucursal(sucursalId);
  }

  private static readonly PRECIO_APARTADO_POSTAL = 87_500;

  async contratarApartado(cajaId: number, clienteId: number, dto: ContratarApartadoDto) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);

    const apartado = await this.repo.findApartadoByNumero(dto.sucursalId ?? 0, dto.numeroApartado);

    // La búsqueda se hace por sucursal; el cajaId nos da la sucursal indirectamente.
    // Resolvemos buscar directamente por número en cualquier sucursal del punto.
    if (!apartado) throw new ApartadoNoEncontradoError(dto.numeroApartado);
    if (apartado.estado !== 'disponible') throw new ApartadoNoDisponibleError(dto.numeroApartado);

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin    = new Date(fechaInicio);
    fechaFin.setMonth(fechaFin.getMonth() + dto.meses);

    const apartadoContratado = await this.repo.contratarApartado({
      sucursalId:   apartado.sucursalId,
      numero:       dto.numeroApartado,
      tamano:       dto.tamano,
      clienteId,
      sesionCajaId: sesion.id,
      fechaInicio,
      fechaFin,
      monto:        VentasService.PRECIO_APARTADO_POSTAL,
      incluyeIva:   false,
    });

    const { movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           'apartado_postal',
      monto:          String(VentasService.PRECIO_APARTADO_POSTAL),
      referenciaId:   apartadoContratado.id,
      referenciaTipo: 'ApartadoPostal',
    });

    return { apartado: apartadoContratado, movimiento, saldoActual, alertas };
  }

  // ── Admin CRUD Apartados ──────────────────────────────────────────────────────

  async listApartadosAdmin(filters: { sucursalId?: number; estado?: string; tamano?: string }) {
    return this.repo.findAllApartadosAdmin(filters);
  }

  async createApartadoAdmin(dto: CrearApartadoAdminDto) {
    const existing = await this.repo.findApartadoByNumero(dto.sucursalId, dto.numero);
    if (existing) throw new ConflictException(`El apartado #${dto.numero} ya existe en esta sucursal`);
    return this.repo.createApartado({
      sucursalId:            dto.sucursalId,
      numero:                dto.numero,
      tamano:                dto.tamano,
      diasAlertaVencimiento: dto.diasAlertaVencimiento,
    });
  }

  async updateApartadoAdmin(id: number, dto: UpdateApartadoAdminDto) {
    return this.repo.updateApartadoAdmin(id, dto);
  }

  async deleteApartadoAdmin(id: number) {
    const item = await this.repo.findApartadoById(id);
    if (!item) throw new NotFoundException(`Apartado #${id} no encontrado`);
    if (item.estado === 'ocupado') throw new ConflictException('No se puede eliminar un apartado ocupado');
    await this.repo.deleteApartado(id);
  }

  // ── Servicios Postales ────────────────────────────────────────────────────────

  async cotizarEnvio(servicioId: number, pesoFisicoKg: number, altoCm?: number, anchoCm?: number, largoCm?: number, paisDestino = 'CO') {
    const servicio = await this.repo.findServicioById(servicioId);
    if (!servicio) throw new ServicioNoEncontradoError(servicioId);

    const pesoVolumetrico = altoCm && anchoCm && largoCm
      ? (altoCm * anchoCm * largoCm) / servicio.factorVolumetrico
      : null;

    const pesoTarificado = pesoVolumetrico
      ? Math.max(pesoFisicoKg, pesoVolumetrico)
      : pesoFisicoKg;

    const tarifa = await this.repo.findTarifaEnvio(servicioId, pesoTarificado, paisDestino);
    if (!tarifa) throw new TarifaNoEncontradaError(servicioId, pesoTarificado);

    // Bug #15: validar peso máximo del servicio
    if (servicio.pesoMaximoKg !== null && pesoTarificado > servicio.pesoMaximoKg) {
      throw new Error(`Peso ${pesoTarificado} kg supera el límite del servicio (${servicio.pesoMaximoKg} kg)`);
    }

    let valorServicio = tarifa.tarifa;
    // Bug #3: el kg adicional se calcula desde el techo del tramo (pesoMaxKg), no el piso (pesoMinKg)
    if (tarifa.tarifaKgAdicional && tarifa.pesoMaxKg !== null && pesoTarificado > tarifa.pesoMaxKg) {
      const kgExtra = pesoTarificado - tarifa.pesoMaxKg;
      valorServicio += kgExtra * tarifa.tarifaKgAdicional;
    }

    return {
      servicio,
      pesoFisicoKg,
      pesoVolumetricoKg: pesoVolumetrico,
      pesoTarificadoKg:  pesoTarificado,
      tarifa,
      valorServicio:     Math.round(valorServicio),
    };
  }

  async crearEnvio(cajaId: number, usuarioId: number, dto: CrearEnvioDto) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);

    const cotizacion = await this.cotizarEnvio(
      dto.servicioId,
      dto.peseFisicoKg,
      dto.altoCm,
      dto.anchoCm,
      dto.largoCm,
      dto.destinatario.pais,
    );

    const valorSeguro  = dto.seguroAdicional && dto.valorDeclarado
      ? Math.round(dto.valorDeclarado * 0.005)
      : 0;
    const valorTotal   = cotizacion.valorServicio + valorSeguro;
    const numeroGuia   = this._generarNumeroGuia();

    const cliente = await this.repo.findClienteByDocumento(
      dto.remitente.documento ? 'CC' : '', dto.remitente.documento ?? '',
    );

    const envio = await this.repo.crearEnvio({
      sucursalId:           dto.sucursalId,
      sesionCajaId:         sesion.id,
      usuarioId,
      clienteId:            cliente?.id,
      servicioId:           dto.servicioId,
      tipo:                 cotizacion.servicio.tipo,
      numeroGuia,
      remitenteNombre:      dto.remitente.nombre,
      remitenteDocumento:   dto.remitente.documento,
      remitenteEmail:       dto.remitente.email,
      remitenteTelefono:    dto.remitente.telefono,
      remitenteDireccion:   dto.remitente.direccion,
      remitenteCiudad:      dto.remitente.ciudad,
      remitenteCp:          dto.remitente.codigoPostal,
      destinatarioNombre:   dto.destinatario.nombre,
      destinatarioDocumento: dto.destinatario.documento,
      destinatarioEmail:    dto.destinatario.email,
      destinatarioTelefono: dto.destinatario.telefono,
      destinatarioDireccion: dto.destinatario.direccion,
      destinatarioCiudad:   dto.destinatario.ciudad,
      destinatarioPais:     dto.destinatario.pais,
      destinatarioCp:       dto.destinatario.codigoPostal,
      pesoFisicoKg:         dto.peseFisicoKg,
      altoCm:               dto.altoCm,
      anchoCm:              dto.anchoCm,
      largoCm:              dto.largoCm,
      pesoVolumetricoKg:    cotizacion.pesoVolumetricoKg ?? undefined,
      pesoTarificadoKg:     cotizacion.pesoTarificadoKg,
      valorDeclarado:       dto.valorDeclarado,
      valorServicio:        cotizacion.valorServicio,
      valorEstampillas:     0,
      valorSeguro,
      valorTotal,
      medioPago:            dto.medioPago as any,
      contenido:            dto.contenido,
      observaciones:        dto.observaciones,
    });

    const { movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           'venta_servicio',
      monto:          String(valorTotal),
      medioPago:      dto.medioPago as any,
      referenciaId:   envio.id,
      referenciaTipo: 'Envio',
    });

    return { envio, cotizacion, movimiento, saldoActual, alertas };
  }

  // ── Resumen del turno ─────────────────────────────────────────────────────────

  async getResumenTurno(cajaId: number) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);
    return this.repo.getResumenSesion(sesion.id);
  }

  // ── Helpers privados ──────────────────────────────────────────────────────────

  private async _recalcularTotales(ventaId: number) {
    const ventaFull = await this.repo.findVentaConDetalle(ventaId);
    if (!ventaFull?.detalle) return;

    const totales = calcularTotalesCarrito(
      ventaFull.detalle.map(d => ({
        precioUnitario: d.precioUnitario,
        cantidad:       d.cantidad,
        descuento:      d.descuento,
        porcentajeTax:  d.porcentajeTax ?? 0,
      })),
    );

    await this.repo.confirmarVenta(ventaId, {
      medioPago: ventaFull.medioPago,
      ...totales as any,
    });
  }

  private _generarNumeroGuia(): string {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `GU${ts}${rand}`;
  }

  private _resolverTipoMovimiento(detalle: Array<{ tipoProducto?: string | null }>) {
    const tipos = detalle.map(d => d.tipoProducto);
    if (tipos.some(t => t === 'otro'))                                    return 'venta_servicio'  as const;
    if (tipos.every(t => t === 'estampilla' || t === 'filatelia'))        return 'venta_estampilla' as const;
    return 'venta_producto' as const;
  }
}
