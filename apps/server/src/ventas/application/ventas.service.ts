import { Injectable, Inject, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { CajasService }       from '../../cajas/application/cajas.service.js';
import { InventarioService }  from '../../inventario/application/inventario.service.js';
import { AuditService }       from '../../audit/audit.service.js';
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
  validarEfectivoSuficiente,
} from '../domain/business-rules.js';
import { calcularPesoVolumetrico } from '../domain/calculos/peso-volumetrico.js';
import { calcularPesoVolumetricoIntl } from '../domain/calculos/peso-volumetrico-intl.js';
import { calcularPesoFacturado } from '../domain/calculos/peso-facturado.js';
import { validarPesoMaximo } from '../domain/calculos/validar-peso-maximo.js';
import { calcularKgAdicional } from '../domain/calculos/kg-adicional.js';
import { calcularValorServicioTotal } from '../domain/calculos/valor-servicio-total.js';
import { calcularSeguroPostal } from '../domain/calculos/seguro-postal.js';
import { calcularFechaVencimiento } from '../domain/calculos/fecha-vencimiento.js';
import { calcularPrecioPorMeses } from '../domain/calculos/precio-por-meses.js';
import { calcularIvaApartado } from '../domain/calculos/iva-apartado.js';
import { generarNumeroGuiaSecuencia } from '../domain/calculos/numero-guia-secuencia.js';
import { calcularValorEstampillasRequeridas } from '../domain/calculos/valor-estampillas-requeridas.js';
import { calcularPrecioPorCantidad } from '../domain/calculos/precio-por-cantidad.js';
import { calcularTotalEnvioNacional } from '../domain/calculos/total-envio-nacional.js';
import { calcularTotalEnvioInternacional } from '../domain/calculos/total-envio-internacional.js';
import { calcularDiasParaVencer } from '../domain/calculos/dias-para-vencer.js';
import { evaluarAlertaVencimientoApartado } from '../domain/calculos/alerta-vencimiento.js';
import { buildAnulacionVenta } from '../domain/calculos/anulacion-venta.js';
import { calcularRenovacionApartado } from '../domain/calculos/renovacion-apartado.js';
import { calcularTarifaInternacionalMs } from '../domain/calculos/tarifa-internacional-ms.js';
import { calcularTiempoEntregaEstimado } from '../domain/calculos/tiempo-entrega-estimado.js';
import { validarValorDeclaradoIntl }      from '../domain/calculos/validar-valor-declarado-intl.js';
import { calcularImpuestosAduanaDestino } from '../domain/calculos/impuestos-aduana-destino.js';
import { validarGuiaCp }                 from '../domain/calculos/guia-cp-validacion.js';
import { validarPreporteado }            from '../domain/calculos/preporteado.js';
import { validarPermitePreporteado }     from '../domain/calculos/valida-preporteado.js';
import { buildMixtoPreporteado }         from '../domain/calculos/mixto-preporteado.js';
import { calcularConversionMoneda }      from '../domain/calculos/conversion-moneda.js';
import type { RenovarApartadoDto } from '../dto/renovar-apartado.dto.js';
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
    private readonly inventarioService: InventarioService,
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

    const producto = await this.repo.findProductoById(dto.productoId, sesion.sucursalId);
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
        precioUnitario = Number(calcularPrecioPorCantidad(
          tarifas.map(t => ({
            minCantidad:    t.minCantidad,
            maxCantidad:    t.maxCantidad,
            precioUnitario: String(t.precio),
          })),
          dto.cantidad,
        ));
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
      const stock = await this.inventarioService.getStock(sesion.sucursalId, item.productoId);
      if (stock !== null && stock < item.cantidad) {
        throw new StockInsuficienteError(item.nombreProducto ?? `producto ${item.productoId}`, stock, item.cantidad);
      }
    }

    if (dto.medioPago === 'efectivo') {
      validarEfectivoSuficiente(dto.efectivoRecibido!, venta.total);
    }

    const ventaActualizada = await this.repo.confirmarVenta(ventaId, {
      medioPago:        dto.medioPago,
      efectivoRecibido: dto.efectivoRecibido,
      emailFactura:     dto.emailFactura ?? undefined,
    });

    // Descontar inventario para cada servicio especial (validación atómica dentro de la transacción)
    for (const item of itemsServicio) {
      try {
        await this.inventarioService.descontarInventario({
          productoId:     item.productoId,
          sucursalId:     sesion.sucursalId,
          cantidad:       item.cantidad,
          referenciaId:   ventaId,
          referenciaTipo: 'Venta',
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
      await this.inventarioService.restaurarInventario({
        productoId:     item.productoId,
        sucursalId:     sesion.sucursalId,
        cantidad:       item.cantidad,
        referenciaId:   ventaId,
        referenciaTipo: 'VentaAnulada',
        usuarioId,
      });
    }

    const tipoOriginal = this._resolverTipoMovimiento(venta.detalle ?? []);
    const anulacion = buildAnulacionVenta(String(venta.total), tipoOriginal);

    const { movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           anulacion.movimientoCaja.tipoMovimiento as any,
      monto:          anulacion.movimientoCaja.monto,
      referenciaId:   ventaId,
      referenciaTipo: 'Venta',
    });

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      accion: 'UPDATE', entidad: 'venta', entidad_id: ventaId, usuario_id: userId, ip_origen: ip,
      datos_despues: {
        evento:         'anular_venta',
        motivo:         dto.motivo,
        total:          venta.total,
        tipoOriginal,
        revertirStock:  anulacion.revertirStock,
        sesionCajaId:   sesion!.id,
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
    const items = await this.repo.findApartadosDisponibles(sucursalId, tamano as any);
    return items.map(item => this._enriquecerApartado(item));
  }

  async getServiciosPostales(sucursalId: number) {
    return this.repo.findServiciosBySucursal(sucursalId);
  }

  private static readonly TARIFA_ANUAL_APARTADO_POSTAL = 87_500 * 12;

  async contratarApartado(cajaId: number, clienteId: number, dto: ContratarApartadoDto) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);

    const apartado = await this.repo.findApartadoByNumero(sesion.sucursalId, dto.numeroApartado);
    if (!apartado) throw new ApartadoNoEncontradoError(dto.numeroApartado);
    if (apartado.estado !== 'disponible') throw new ApartadoNoDisponibleError(dto.numeroApartado);

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin    = new Date(calcularFechaVencimiento(dto.fechaInicio, dto.meses));

    const precioBase = calcularPrecioPorMeses(String(VentasService.TARIFA_ANUAL_APARTADO_POSTAL), dto.meses);
    const ivaResult  = calcularIvaApartado(precioBase, '19', true);

    const apartadoContratado = await this.repo.contratarApartado({
      sucursalId:   apartado.sucursalId,
      numero:       dto.numeroApartado,
      tamano:       dto.tamano,
      clienteId,
      sesionCajaId: sesion.id,
      fechaInicio,
      fechaFin,
      monto:        Number(ivaResult.precioTotal),
      incluyeIva:   true,
    });

    const { movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           'apartado_postal',
      monto:          ivaResult.precioTotal,
      referenciaId:   apartadoContratado.id,
      referenciaTipo: 'ApartadoPostal',
    });

    return { apartado: apartadoContratado, movimiento, saldoActual, alertas };
  }

  // ── Renovación de apartado postal ────────────────────────────────────────────

  async renovarApartado(cajaId: number, apartadoId: number, dto: RenovarApartadoDto) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);

    const apartado = await this.repo.findApartadoById(apartadoId);
    if (!apartado) throw new ApartadoNoEncontradoError(String(apartadoId));
    if (apartado.estado !== 'ocupado') throw new ApartadoNoDisponibleError(String(apartadoId));

    const fechaFinActual = apartado.fechaFin
      ? apartado.fechaFin.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const renovacion = calcularRenovacionApartado(
      fechaFinActual,
      dto.meses,
      String(VentasService.TARIFA_ANUAL_APARTADO_POSTAL),
      '19',
      apartado.incluyeIva,
    );

    const apartadoRenovado = await this.repo.renovarApartado(apartadoId, {
      nuevaFechaFin: new Date(renovacion.nuevaFechaFin),
      monto:         Number(renovacion.precioTotal),
      sesionCajaId:  sesion.id,
    });

    const { movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           'apartado_postal',
      monto:          renovacion.precioTotal,
      referenciaId:   apartadoId,
      referenciaTipo: 'ApartadoPostal',
    });

    return { apartado: apartadoRenovado, renovacion, movimiento, saldoActual, alertas };
  }

  // ── Admin CRUD Apartados ──────────────────────────────────────────────────────

  async listApartadosAdmin(filters: { sucursalId?: number; estado?: string; tamano?: string }) {
    const items = await this.repo.findAllApartadosAdmin(filters);
    return items.map(item => this._enriquecerApartado(item));
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

  async cotizarEnvio(
    servicioId: number,
    pesoFisicoKg: number,
    altoCm?: number,
    anchoCm?: number,
    largoCm?: number,
    paisDestino = 'CO',
    ciudadDestino?: string,
    // optional: when provided, cotización includes aduana tax estimate
    porcentajeArancel?: number,
    trmDia?: number,
  ) {
    const servicio = await this.repo.findServicioById(servicioId);
    if (!servicio) throw new ServicioNoEncontradoError(servicioId);

    const esIntl = paisDestino !== 'CO' && servicio.tipo?.includes('internacional');

    // Use the international volumetric formula for intl services (validates provider max)
    let pesoVolumetrico: number | null = null;
    if (altoCm && anchoCm && largoCm) {
      if (esIntl) {
        const intlResult = calcularPesoVolumetricoIntl(altoCm, anchoCm, largoCm, servicio.factorVolumetrico ?? undefined, servicio.pesoMaximoKg ?? undefined);
        if (!intlResult.valido) {
          throw new Error(`Peso volumétrico ${intlResult.pesoVol.toFixed(3)} kg supera máximo del proveedor ${intlResult.pesoMaximoProveedor} kg`);
        }
        pesoVolumetrico = intlResult.pesoVol;
      } else {
        pesoVolumetrico = calcularPesoVolumetrico(altoCm, anchoCm, largoCm, servicio.factorVolumetrico ?? undefined);
      }
    }

    const pesoTarificado = calcularPesoFacturado(pesoFisicoKg, pesoVolumetrico ?? undefined);
    validarPesoMaximo(pesoTarificado, servicio.pesoMaximoKg ?? undefined);

    let valorServicio: number;
    let tarifa: import('../domain/venta.entity.js').TarifaEnvioEntity | null = null;

    if (esIntl) {
      // Use UPU table (all rows for service+country) — finds the weight range
      const tarifasRows = await this.repo.findTarifasEnvioByPais(servicioId, paisDestino);
      const tarifasUpu = tarifasRows.map(r => ({
        paisDestino: r.paisDestino,
        pesoMinKg:   String(r.pesoMinKg),
        pesoMaxKg:   String(r.pesoMaxKg ?? 9999),
        tarifaCop:   String(r.tarifa),
        vigente:     true as const,
      }));
      const tarifaCop = calcularTarifaInternacionalMs(tarifasUpu, paisDestino, pesoTarificado);
      tarifa = tarifasRows[0] ?? null;
      valorServicio = Number(tarifaCop);
    } else {
      tarifa = await this.repo.findTarifaEnvio(servicioId, pesoTarificado, paisDestino, ciudadDestino);
      if (!tarifa) throw new TarifaNoEncontradaError(servicioId, pesoTarificado);
      const valorKgAdicional = tarifa.tarifaKgAdicional != null && tarifa.pesoMaxKg != null
        ? calcularKgAdicional(pesoTarificado, tarifa.pesoMaxKg, String(tarifa.tarifaKgAdicional))
        : '0';
      valorServicio = Number(calcularValorServicioTotal(String(tarifa.tarifa), valorKgAdicional));
    }

    const fechaEntregaEstimada = servicio.tiempoEntregaDias
      ? calcularTiempoEntregaEstimado(new Date(), servicio.tiempoEntregaDias)
      : null;

    // Aduana estimate (informational only — recipient responsibility at destination)
    let aduanaEstimadoUSD: string | null = null;
    if (esIntl && porcentajeArancel != null && trmDia != null && trmDia > 0) {
      const { valorUsd } = calcularConversionMoneda(String(valorServicio), String(trmDia));
      aduanaEstimadoUSD = calcularImpuestosAduanaDestino(valorUsd, String(porcentajeArancel));
    }

    return {
      servicio,
      pesoFisicoKg,
      pesoVolumetricoKg:     pesoVolumetrico,
      pesoTarificadoKg:      pesoTarificado,
      tarifa,
      valorServicio,
      fechaEntregaEstimada,
      aduanaEstimadoUSD,
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
      dto.destinatario.ciudad,
    );

    const valorSeguro = dto.seguroAdicional && dto.valorDeclarado
      ? Number(calcularSeguroPostal(String(dto.valorDeclarado), '0.5'))
      : 0;
    const denominacionesEstampilla = cotizacion.servicio.requiereEstampilla
      ? await this.repo.findEstampillasConStock(sesion.sucursalId)
      : [];
    const estampillasResult = calcularValorEstampillasRequeridas(
      cotizacion.servicio.requiereEstampilla ?? false,
      String(cotizacion.valorServicio),
      denominacionesEstampilla,
    );
    const esInternacional = dto.destinatario.pais && dto.destinatario.pais !== 'CO';

    // international: validate declared value ceiling
    if (esInternacional && dto.valorDeclarado) {
      validarValorDeclaradoIntl(String(dto.valorDeclarado));
    }

    const valorTotal = esInternacional
      ? Number(calcularTotalEnvioInternacional(
          String(cotizacion.valorServicio),
          String(valorSeguro),
          estampillasResult.valorEstampillas,
        ))
      : Number(calcularTotalEnvioNacional(
          String(cotizacion.valorServicio),
          estampillasResult.valorEstampillas,
          String(valorSeguro),
        ));

    // preporteado: estampillas must exactly cover the service cost
    if (dto.medioPago === 'preporteado') {
      validarPreporteado(estampillasResult.valorEstampillas, String(cotizacion.valorServicio));
    }

    // mixto: estampillas + efectivo must equal service cost
    if (dto.medioPago === 'mixto_preporteado') {
      if (!dto.montoEstampillas || !dto.montoEfectivo) {
        throw new Error('mixto_preporteado requiere montoEstampillas y montoEfectivo');
      }
      buildMixtoPreporteado(
        String(dto.montoEstampillas),
        String(dto.montoEfectivo),
        String(cotizacion.valorServicio),
      );
    }

    const numeroGuia = await this._generarNumeroGuia();

    // international CP guide: validate format — DB unique constraint handles duplicates
    if (esInternacional && dto.guiaCp) {
      validarGuiaCp(dto.guiaCp, []);
    }

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
      valorEstampillas:     Number(estampillasResult.valorEstampillas),
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

  async getPaisesDestinoByServicio(servicioId: number): Promise<string[]> {
    return this.repo.findPaisesDestinoByServicio(servicioId);
  }

  conversionMoneda(valorCop: number, trmDia: number) {
    return calcularConversionMoneda(String(valorCop), String(trmDia));
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

  private _enriquecerApartado<T extends { fechaFin: Date | null; diasAlertaVencimiento: number; id: number; clienteId: number | null; sucursalId: number; estado: string }>(item: T) {
    const diasRestantes = item.fechaFin && item.estado === 'ocupado'
      ? calcularDiasParaVencer(item.fechaFin.toISOString().split('T')[0])
      : null;
    const alertaVencimiento = diasRestantes !== null
      ? evaluarAlertaVencimientoApartado(
          diasRestantes,
          item.diasAlertaVencimiento,
          item.id,
          item.clienteId ?? 0,
          item.sucursalId,
        ).generarAlerta
      : false;
    return { ...item, diasRestantes, alertaVencimiento };
  }

  private async _generarNumeroGuia(): Promise<string> {
    const consecutivo = await this.repo.nextConsecutivoGuia();
    return generarNumeroGuiaSecuencia('GU', consecutivo);
  }

  private _resolverTipoMovimiento(detalle: Array<{ tipoProducto?: string | null }>) {
    const tipos = detalle.map(d => d.tipoProducto);
    if (tipos.some(t => t === 'otro'))                                    return 'venta_servicio'  as const;
    if (tipos.every(t => t === 'estampilla' || t === 'filatelia'))        return 'venta_estampilla' as const;
    return 'venta_producto' as const;
  }
}
