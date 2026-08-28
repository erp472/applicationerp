import { Injectable, Inject, Optional, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { CajasService }       from '../../cajas/application/cajas.service.js';
import { InventarioService }  from '../../inventario/application/inventario.service.js';
import { AuditService }       from '../../audit/audit.service.js';
import { PrismaService }      from '../../prisma/prisma.service.js';
import { RealtimeService }    from '../../realtime/realtime.service.js';
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
import type { MedioPago } from '../../cajas/domain/caja.entity.js';
import { calcularPesoVolumetrico } from '../domain/calculos/peso-volumetrico.js';
import { calcularPesoVolumetricoIntl } from '../domain/calculos/peso-volumetrico-intl.js';
import { calcularPesoFacturado } from '../domain/calculos/peso-facturado.js';
import { validarPesoMaximo } from '../domain/calculos/validar-peso-maximo.js';
import { validarDimensionesMaximas } from '../domain/calculos/validar-dimensiones-maximas.js';
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
import { calcularCertificacionCorreo } from '../domain/calculos/calcular-certificacion-correo.js';
import { calcularDiasParaVencer } from '../domain/calculos/dias-para-vencer.js';
import { evaluarAlertaVencimientoApartado } from '../domain/calculos/alerta-vencimiento.js';
import { buildAnulacionVenta } from '../domain/calculos/anulacion-venta.js';
import { calcularRenovacionApartado } from '../domain/calculos/renovacion-apartado.js';
import { calcularTarifaInternacionalMs } from '../domain/calculos/tarifa-internacional-ms.js';
import { verificarStockDisponible } from '../../inventario/domain/calculos/stock-disponible.js';
import { calcularDisponibilidadApartados } from '../domain/calculos/disponibilidad-apartados.js';
import { calcularDescuentoVolumen } from '../domain/calculos/descuento-volumen.js';
import { calcularTiempoEntregaEstimado } from '../domain/calculos/tiempo-entrega-estimado.js';
import { validarValorDeclaradoIntl }      from '../domain/calculos/validar-valor-declarado-intl.js';
import { calcularImpuestosAduanaDestino } from '../domain/calculos/impuestos-aduana-destino.js';
import { validarGuiaCp }                 from '../domain/calculos/guia-cp-validacion.js';
import { validarPreporteado }            from '../domain/calculos/preporteado.js';
import { validarPermitePreporteado }     from '../domain/calculos/valida-preporteado.js';
import { buildMixtoPreporteado }         from '../domain/calculos/mixto-preporteado.js';
import { calcularConversionMoneda }      from '../domain/calculos/conversion-moneda.js';
import { validarLimitesCantidad }        from '../domain/calculos/validar-limites-cantidad.js';
import type { RenovarApartadoDto } from '../dto/renovar-apartado.dto.js';
import type { IniciarVentaDto }       from '../dto/iniciar-venta.dto.js';
import type { AgregarProductoDto }    from '../dto/agregar-producto.dto.js';
import type { ConfirmarVentaDto }     from '../dto/confirmar-venta.dto.js';
import type { AnularVentaDto }        from '../dto/anular-venta.dto.js';
import type { ContratarApartadoDto }           from '../dto/contratar-apartado.dto.js';
import type { AgregarApartadoCarritoDto }       from '../dto/agregar-apartado-carrito.dto.js';
import type { CrearApartadoAdminDto }           from '../dto/crear-apartado-admin.dto.js';
import type { UpdateApartadoAdminDto }          from '../dto/update-apartado-admin.dto.js';
import type { CrearEnvioDto }                   from '../dto/crear-envio.dto.js';
import { generarGuiaEnvioSvg } from '../domain/guia-svg.generator.js';
import { generarReciboPdf }   from '../domain/recibo-pdf.generator.js';
import { svgToPdf }            from '../../common/svg-to-pdf.js';
import { StorageService }       from '../../storage/storage.service.js';
import * as fs from 'node:fs';

@Injectable()
export class VentasService {
  constructor(
    @Inject(VENTAS_REPOSITORY)
    private readonly repo: IVentasRepository,
    private readonly cajasService: CajasService,
    private readonly inventarioService: InventarioService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  // ── Catálogo ─────────────────────────────────────────────────────────────────

  async getCatalogo(sucursalId: number, tipo?: TipoProducto) {
    return this.repo.findProductosBySucursal(sucursalId, tipo);
  }

  async getTarifasEspecial(productoId: number) {
    return this.repo.findTarifasEspecial(productoId);
  }

  async setTarifasEspecial(
    productoId: number,
    tarifas: Array<{ minCantidad: number; maxCantidad: number | null; precio: number }>,
  ) {
    return this.repo.setTarifasEspecial(productoId, tarifas);
  }

  // ── Buscar cliente ────────────────────────────────────────────────────────────

  async buscarCliente(tipo: string, numero: string) {
    return this.repo.findClienteByDocumento(tipo, numero);
  }

  async getEstampillasDisponibles(cajaId: number) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) return [];
    return this.repo.findEstampillasConStock(sesion.sucursalId);
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

    if (producto.tipo === 'otro') {
      try {
        validarLimitesCantidad(dto.cantidad, producto.cantidadMinima, producto.cantidadMaxima);
      } catch (err: unknown) {
        const msg = (err as Error).message;
        if (msg.includes('mínimo')) throw new CantidadMinimaError(producto.nombre, producto.cantidadMinima!);
        if (msg.includes('máximo')) throw new CantidadMaximaError(producto.nombre, producto.cantidadMaxima!);
        throw err;
      }
    }

    let precioUnitario = producto.precio;
    if (producto.tipo === 'otro') {
      const tarifas = await this.repo.findTarifasEspecial(dto.productoId);
      if (tarifas.length > 0) {
        precioUnitario = Number(calcularDescuentoVolumen(
          tarifas.map(t => ({
            minCantidad:    t.minCantidad,
            maxCantidad:    t.maxCantidad,
            precioUnitario: String(t.precio),
          })),
          dto.cantidad,
          String(producto.precio),
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

  // ── Agregar envío al carrito ──────────────────────────────────────────────────

  async agregarEnvioAlCarrito(ventaId: number, cajaId: number, usuarioId: number, dto: CrearEnvioDto) {
    const venta = await this.repo.findVentaById(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);

    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);
    validarVentaEnSesion(ventaId, venta.sesionCajaId, sesion.id);

    const cotizacion = await this.cotizarEnvio(
      dto.servicioId,
      dto.pesoFisicoKg,
      dto.altoCm,
      dto.anchoCm,
      dto.largoCm,
      dto.destinatario.pais,
      dto.destinatario.ciudad,
      undefined,
      undefined,
      dto.tipoTrayecto,
    );

    const valorSeguro = dto.seguroAdicional && dto.valorDeclarado
      ? Number(calcularSeguroPostal(String(dto.valorDeclarado), '0.5'))
      : 0;

    const denominacionesEstampilla = cotizacion.servicio.requiereEstampilla
      ? await this.repo.findEstampillasConStock(sesion.sucursalId)
      : [];
    let estampillasResult = { valorEstampillas: '0', seleccion: [] as import('../domain/calculos/valor-estampillas-requeridas.js').SeleccionEstampilla[] };
    try {
      estampillasResult = calcularValorEstampillasRequeridas(
        cotizacion.servicio.requiereEstampilla ?? false,
        String(cotizacion.valorServicio),
        denominacionesEstampilla,
      );
    } catch { /* sin stock suficiente — el cajero gestiona las estampillas físicamente */ }
    const esInternacional = dto.destinatario.pais && dto.destinatario.pais !== 'CO';

    if (esInternacional && dto.valorDeclarado) {
      validarValorDeclaradoIntl(String(dto.valorDeclarado));
    }

    const valorCertificacion = esInternacional ? 0 : cotizacion.valorCertificacion;

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
          '0',
          String(valorCertificacion),
        ));

    if (dto.medioPago === 'preporteado') {
      validarPreporteado(estampillasResult.valorEstampillas, String(cotizacion.valorServicio));
    }
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

    if (esInternacional && dto.guiaCp) {
      validarGuiaCp(dto.guiaCp, []);
    }

    const numeroGuia = await this._generarNumeroGuia();

    const envio = await this.repo.crearEnvio({
      ventaId,
      sucursalId:           sesion.sucursalId,
      sesionCajaId:         sesion.id,
      usuarioId,
      clienteId:            venta.clienteId ?? undefined,
      servicioId:           dto.servicioId,
      tipo:                 cotizacion.servicio.tipo,
      numeroGuia,
      estado:               'pendiente',
      remitenteNombre:      dto.remitente.nombre,
      remitenteDocumento:   dto.remitente.documento,
      remitenteEmail:       dto.remitente.email,
      remitenteTelefono:    dto.remitente.telefono,
      remitenteDireccion:   dto.remitente.direccion,
      remitenteCiudad:          dto.remitente.ciudad,
      remitenteDepartamento:    dto.remitente.departamento,
      remitenteCp:              dto.remitente.codigoPostal,
      destinatarioNombre:       dto.destinatario.nombre,
      destinatarioDocumento:    dto.destinatario.documento,
      destinatarioEmail:        dto.destinatario.email,
      destinatarioTelefono:     dto.destinatario.telefono,
      destinatarioDireccion:    dto.destinatario.direccion,
      destinatarioCiudad:       dto.destinatario.ciudad,
      destinatarioDepartamento: dto.destinatario.departamento,
      destinatarioPais:         dto.destinatario.pais,
      destinatarioCp:           dto.destinatario.codigoPostal,
      pesoFisicoKg:         dto.pesoFisicoKg,
      altoCm:               dto.altoCm,
      anchoCm:              dto.anchoCm,
      largoCm:              dto.largoCm,
      pesoVolumetricoKg:    cotizacion.pesoVolumetricoKg ?? undefined,
      pesoTarificadoKg:     cotizacion.pesoTarificadoKg,
      valorDeclarado:       dto.valorDeclarado,
      valorServicio:        cotizacion.valorServicio,
      valorEstampillas:     Number(estampillasResult.valorEstampillas),
      valorSeguro,
      valorCertificacion,
      valorTotal,
      medioPago:            dto.medioPago as any,
      contenido:            dto.contenido,
      observaciones:        dto.observaciones,
    });

    if (venta.clienteId) {
      await this._guardarDireccionesFrecuentes(venta.clienteId, dto);
    }

    await this._recalcularTotales(ventaId);

    return { envio, cotizacion, numeroGuia, seleccionEstampillas: estampillasResult.seleccion };
  }

  async eliminarEnvioDelCarrito(ventaId: number, envioId: number) {
    const venta = await this.repo.findVentaById(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);

    const enviosPendientes = await this.repo.findEnviosPendientesByVenta(ventaId);
    const envio = enviosPendientes.find(e => e.id === envioId);
    if (!envio) throw new ServicioNoEncontradoError(envioId);

    await this.repo.anularEnvio(envioId);
    await this._recalcularTotales(ventaId);
  }

  // ── Confirmar venta ───────────────────────────────────────────────────────────

  async confirmarVenta(ventaId: number, dto: ConfirmarVentaDto, cajaId: number, usuarioId: number) {
    const venta = await this.repo.findVentaConDetalle(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);
    validarCarritoNoVacio(
      venta.detalle?.length ?? 0,
      venta.envios?.length ?? 0,
      venta.apartadosPendientes?.length ?? 0,
    );

    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);
    validarVentaEnSesion(ventaId, venta.sesionCajaId, sesion.id);

    // Validar stock para todos los productos que tienen inventario registrado
    const todosItems = venta.detalle ?? [];
    for (const item of todosItems) {
      const stock = await this.inventarioService.getStock(sesion.sucursalId, item.productoId);
      if (stock !== null) {
        try {
          verificarStockDisponible(stock, item.cantidad, 0);
        } catch {
          throw new StockInsuficienteError(item.nombreProducto ?? `producto ${item.productoId}`, stock, item.cantidad);
        }
      }
    }

    if (dto.medioPago === 'efectivo') {
      validarEfectivoSuficiente(dto.efectivoRecibido!, venta.total);
    }
    if (dto.medioPago === 'preporteado') {
      validarPreporteado(String(dto.montoEstampillas!), String(venta.total));
    }
    if (dto.medioPago === 'mixto_preporteado') {
      buildMixtoPreporteado(
        String(dto.montoEstampillas!),
        String(dto.montoEfectivo!),
        String(venta.total),
      );
    }
    if (dto.medioPago === 'estampilla') {
      const totalEstampillas = (dto.estampillasUtilizadas ?? []).reduce((s, e) => s + e.valor, 0);
      const montoCash        = dto.montoEfectivo ?? 0;
      if (Math.round(totalEstampillas + montoCash) !== Math.round(venta.total)) {
        throw new Error(
          `Pago con estampillas no cuadra: estampillas ${totalEstampillas} + efectivo ${montoCash} ` +
          `= ${totalEstampillas + montoCash}, total venta ${venta.total}`,
        );
      }
    }

    const ventaActualizada = await this.repo.confirmarVenta(ventaId, {
      medioPago:        dto.medioPago,
      efectivoRecibido: dto.efectivoRecibido,
      emailFactura:     dto.emailFactura ?? undefined,
    });

    // Descontar inventario para todos los productos con registro de stock
    for (const item of todosItems) {
      const stock = await this.inventarioService.getStock(sesion.sucursalId, item.productoId);
      if (stock === null) continue; // sin inventario → no descontar
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

    // Finalizar envíos pendientes vinculados a esta venta (cambian de pendiente → facturado)
    const enviosPendientes = await this.repo.findEnviosPendientesByVenta(ventaId);
    const guiasGeneradas: import('../domain/venta.entity.js').EnvioEntity[] = [];
    for (const envio of enviosPendientes) {
      const envioFacturado = await this.repo.facturarEnvio(envio.id);
      guiasGeneradas.push(envioFacturado);
    }

    // Finalizar apartados reservados vinculados a esta venta (cambian de reservado → ocupado)
    const apartadosPendientes = await this.repo.findApartadosPendientesByVenta(ventaId);
    let lastApartadoResult: Awaited<ReturnType<typeof this.cajasService.registrarMovimientoVenta>> | null = null;
    for (const apartado of apartadosPendientes) {
      await this.repo.finalizarApartadoReservado(apartado.id);
      lastApartadoResult = await this.cajasService.registrarMovimientoVenta({
        sesionCajaId:   sesion.id,
        tipo:           'apartado_postal',
        monto:          String(apartado.valor ?? 0),
        medioPago:      dto.medioPago as any,
        referenciaId:   apartado.id,
        referenciaTipo: 'ApartadoPostal',
      });
    }

    // Determinar el tipo de movimiento según los productos de la venta
    const tieneEnvios     = guiasGeneradas.length > 0;
    const tieneApartados  = apartadosPendientes.length > 0;
    const tipoMovimiento  = (tieneEnvios || tieneApartados)
      ? 'venta_servicio' as const
      : this._resolverTipoMovimiento(venta.detalle ?? []);

    const descripcionMovimiento = dto.estampillasUtilizadas?.length
      ? [
          `Estampillas: ${dto.estampillasUtilizadas.map(e => `${e.codigo}($${e.valor})`).join(', ')}`,
          dto.montoEfectivo ? `Efectivo: $${dto.montoEfectivo}` : null,
        ].filter(Boolean).join(' + ')
      : undefined;

    // venta.total includes apartados (added by _recalcularTotales). Apartados were already
    // registered individually above, so subtract them to avoid double-counting in caja ledger.
    const totalApartados = apartadosPendientes.reduce((acc, a) => acc + Number(a.valor ?? 0), 0);
    const montoMovVenta  = venta.total - totalApartados;

    let movimiento: Awaited<ReturnType<typeof this.cajasService.registrarMovimientoVenta>>['movimiento'];
    let saldoActual: string;
    let alertas: Awaited<ReturnType<typeof this.cajasService.registrarMovimientoVenta>>['alertas'];

    if (montoMovVenta > 0.001) {
      ({ movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
        sesionCajaId:   sesion.id,
        tipo:           tipoMovimiento,
        monto:          String(montoMovVenta),
        medioPago:      dto.medioPago as any,
        referenciaId:   ventaId,
        referenciaTipo: 'Venta',
        descripcion:    descripcionMovimiento,
      }));
    } else {
      // Venta is composed entirely of apartados — last apartado movement carries the result
      movimiento  = lastApartadoResult!.movimiento;
      saldoActual = lastApartadoResult!.saldoActual;
      alertas     = lastApartadoResult!.alertas;
    }

    const cambio = dto.medioPago === 'efectivo' && dto.efectivoRecibido
      ? Math.max(0, dto.efectivoRecibido - venta.total)
      : dto.montoEfectivo && dto.efectivoRecibido
      ? Math.max(0, dto.efectivoRecibido - dto.montoEfectivo)
      : 0;

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      accion: 'UPDATE', entidad: 'venta', entidad_id: ventaId, usuario_id: userId, ip_origen: ip,
      datos_despues: {
        evento:          'confirmar_pago',
        total:           venta.total,
        medioPago:       dto.medioPago,
        email:           dto.emailFactura,
        cambio,
        sesionCajaId:    sesion!.id,
        cajaId,
        guiasGeneradas:  guiasGeneradas.map(g => g.numeroGuia),
      },
    });

    this.realtime?.broadcast('ventas.venta_confirmada', {
      sucursalId: sesion.sucursalId,
      cajaId,
      ventaId,
      total:      venta.total,
      medioPago:  dto.medioPago,
      items:      (venta.detalle ?? []).map(i => ({
        nombre:   i.nombreProducto ?? `Producto ${i.productoId}`,
        codigo:   i.codigoProducto,
        cantidad: i.cantidad,
        subtotal: i.subtotal,
      })),
    });

    return { venta: ventaActualizada, movimiento, saldoActual, alertas, cambio, guias: guiasGeneradas };
  }

  async getVentasDia(sucursalId: number) {
    return this.repo.findVentasBySucursalHoy(sucursalId);
  }

  async getSaldoAFavor(clienteId: number): Promise<{ saldoAFavor: number }> {
    const cliente = await this.repo.findClienteById(clienteId);
    if (!cliente) throw new ClienteNoEncontradoError('id', String(clienteId));
    return { saldoAFavor: cliente.saldoAFavor };
  }

  // ── Anular venta ──────────────────────────────────────────────────────────────

  async anularVenta(ventaId: number, dto: AnularVentaDto, cajaId: number, usuarioId: number) {
    const venta = await this.repo.findVentaConDetalle(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);

    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);
    validarVentaEnSesion(ventaId, venta.sesionCajaId, sesion.id);

    // Anular envíos pendientes vinculados (no generaron guías aún)
    const enviosPendientes = await this.repo.findEnviosPendientesByVenta(ventaId);
    for (const envio of enviosPendientes) {
      await this.repo.anularEnvio(envio.id);
    }

    // Liberar apartados reservados vinculados (vuelven a 'disponible')
    const apartadosReservados = await this.repo.findApartadosPendientesByVenta(ventaId);
    for (const apartado of apartadosReservados) {
      await this.repo.liberarApartadoReservado(apartado.id);
    }

    const ventaAnulada = await this.repo.anularVenta(ventaId);

    // Restaurar inventario para todos los productos con stock registrado
    for (const item of venta.detalle ?? []) {
      const stock = await this.inventarioService.getStock(sesion.sucursalId, item.productoId);
      if (stock === null) continue;
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

    await this.prisma.anulacion.create({
      data: {
        referencia_idanulaciones:     ventaId,
        referencia_tipoanulaciones:   'Venta',
        motivoanulaciones:            dto.motivo,
        usuarios_idusuarios_solicitante: usuarioId,
        estadoanulaciones:            'pendiente',
      },
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
    const enriquecidos = items.map(item => this._enriquecerApartado(item));
    const disponibilidad = calcularDisponibilidadApartados(
      enriquecidos.map(i => ({ apartadoId: i.id, estado: i.estado, tamano: i.tamano, sucursalId: i.sucursalId })),
      sucursalId,
      tamano,
    );
    return { totalDisponibles: disponibilidad.totalDisponibles, lista: enriquecidos };
  }

  async getApartadosPorSucursal(sucursalId: number, tamano?: string) {
    const items = await this.repo.findApartadosPorSucursal(sucursalId, tamano as any);
    return items.map(item => this._enriquecerApartado(item));
  }

  async getServiciosPostales(sucursalId: number) {
    return this.repo.findServiciosBySucursal(sucursalId);
  }

  private static readonly TARIFA_ANUAL_APARTADO_POSTAL = 87_500;

  // ── Apartado en carrito (flujo correcto con pago al finalizar) ──────────────

  async agregarApartadoAlCarrito(ventaId: number, cajaId: number, clienteId: number, dto: AgregarApartadoCarritoDto) {
    const venta = await this.repo.findVentaById(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);

    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);
    validarVentaEnSesion(ventaId, venta.sesionCajaId, sesion.id);

    const apartado = await this.repo.findApartadoByNumero(dto.sucursalId, dto.numeroApartado);
    if (!apartado) throw new ApartadoNoEncontradoError(dto.numeroApartado);
    if (apartado.estado !== 'disponible') throw new ApartadoNoDisponibleError(dto.numeroApartado);

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin    = new Date(calcularFechaVencimiento(dto.fechaInicio, dto.meses));
    const precioBase  = calcularPrecioPorMeses(String(VentasService.TARIFA_ANUAL_APARTADO_POSTAL), dto.meses);
    const ivaResult   = calcularIvaApartado(precioBase, '19', false);

    const apartadoReservado = await this.repo.reservarApartado({
      apartadoId:   apartado.id,
      tamano:       dto.tamano,
      clienteId,
      ventaId,
      sesionCajaId: sesion.id,
      fechaInicio,
      fechaFin,
      monto:        Number(ivaResult.precioTotal),
      incluyeIva:   false,
    });

    await this._recalcularTotales(ventaId);
    return { apartado: apartadoReservado, cotizacion: { base: Number(ivaResult.precioSinTax), iva: Number(ivaResult.iva), total: Number(ivaResult.precioTotal) } };
  }

  async eliminarApartadoDelCarrito(ventaId: number, apartadoId: number) {
    const venta = await this.repo.findVentaById(ventaId);
    if (!venta) throw new VentaNoEncontradaError(ventaId);
    validarVentaActiva(ventaId, venta.estado);

    const apartado = await this.repo.findApartadoById(apartadoId);
    if (!apartado || apartado.ventaId !== ventaId) {
      throw new ApartadoNoEncontradoError(String(apartadoId));
    }

    await this.repo.liberarApartadoReservado(apartadoId);
    await this._recalcularTotales(ventaId);
  }

  // ── Contratación directa de apartado postal (flujo legacy — sin carrito) ────

  async contratarApartado(cajaId: number, clienteId: number, dto: ContratarApartadoDto) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);

    const apartado = await this.repo.findApartadoByNumero(sesion.sucursalId, dto.numeroApartado);
    if (!apartado) throw new ApartadoNoEncontradoError(dto.numeroApartado);
    if (apartado.estado !== 'disponible') throw new ApartadoNoDisponibleError(dto.numeroApartado);

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin    = new Date(calcularFechaVencimiento(dto.fechaInicio, dto.meses));

    const precioBase = calcularPrecioPorMeses(String(VentasService.TARIFA_ANUAL_APARTADO_POSTAL), dto.meses);
    const ivaResult  = calcularIvaApartado(precioBase, '19', false);

    const apartadoContratado = await this.repo.contratarApartado({
      sucursalId:   apartado.sucursalId,
      numero:       dto.numeroApartado,
      tamano:       dto.tamano,
      clienteId,
      sesionCajaId: sesion.id,
      fechaInicio,
      fechaFin,
      monto:        Number(ivaResult.precioTotal),
      incluyeIva:   false,
    });

    const { movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           'apartado_postal',
      monto:          ivaResult.precioTotal,
      medioPago:      dto.medioPago as MedioPago,
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
    porcentajeArancel?: number,
    trmDia?: number,
    // Tipo de trayecto para servicios nacionales: URBANO | NACIONAL | ESPECIAL
    tipoTrayecto?: 'URBANO' | 'NACIONAL' | 'ESPECIAL',
  ) {
    const servicio = await this.repo.findServicioById(servicioId);
    if (!servicio) throw new ServicioNoEncontradoError(servicioId);

    const esIntl = paisDestino !== 'CO' && servicio.tipo?.includes('internacional');

    // Use the international volumetric formula for intl services (validates provider max)
    let pesoVolumetrico: number | null = null;
    if (altoCm && anchoCm && largoCm) {
      validarDimensionesMaximas(altoCm, anchoCm, largoCm, servicio.altoMaxCm, servicio.anchoMaxCm, servicio.largoMaxCm);
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
      // Para servicios nacionales, tipoTrayecto determina la tarifa aplicable.
      // NACIONAL y undefined → ciudadDestino como lookup; URBANO/ESPECIAL → lookup específico.
      const lookupKey = tipoTrayecto && tipoTrayecto !== 'NACIONAL' ? tipoTrayecto : ciudadDestino;
      tarifa = await this.repo.findTarifaEnvio(servicioId, pesoTarificado, paisDestino, lookupKey);
      if (!tarifa) throw new TarifaNoEncontradaError(servicioId, pesoTarificado);
      const valorKgAdicional = tarifa.tarifaKgAdicional != null
        ? calcularKgAdicional(pesoTarificado, tarifa.pesoMinKg, String(tarifa.tarifaKgAdicional))
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

    const valorCertificacion = calcularCertificacionCorreo(servicio.tarifaCertificacion);

    return {
      servicio,
      pesoFisicoKg,
      pesoVolumetricoKg:     pesoVolumetrico,
      pesoTarificadoKg:      pesoTarificado,
      tarifa,
      valorServicio,
      valorCertificacion,
      fechaEntregaEstimada,
      aduanaEstimadoUSD,
    };
  }

  async crearEnvio(cajaId: number, usuarioId: number, dto: CrearEnvioDto) {
    const sesion = await this.cajasService.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new SesionCajaInactivaError(cajaId);

    if (dto.esCorrespondencia && dto.pesoFisicoKg > 5) {
      throw new Error('Correspondencia: peso máximo 5 kg (5000 g)');
    }

    const cotizacion = await this.cotizarEnvio(
      dto.servicioId,
      dto.pesoFisicoKg,
      dto.esCorrespondencia ? undefined : dto.altoCm,
      dto.esCorrespondencia ? undefined : dto.anchoCm,
      dto.esCorrespondencia ? undefined : dto.largoCm,
      dto.destinatario.pais,
      dto.destinatario.ciudad,
      undefined,
      undefined,
      dto.tipoTrayecto,
    );

    const valorSeguro = dto.seguroAdicional && dto.valorDeclarado
      ? Number(calcularSeguroPostal(
          String(dto.valorDeclarado),
          '0.5',
          cotizacion.servicio.minimoSeguroPostal ?? 0,
        ))
      : 0;
    const denominacionesEstampilla = cotizacion.servicio.requiereEstampilla
      ? await this.repo.findEstampillasConStock(sesion.sucursalId)
      : [];
    let estampillasResult = { valorEstampillas: '0', seleccion: [] as import('../domain/calculos/valor-estampillas-requeridas.js').SeleccionEstampilla[] };
    try {
      estampillasResult = calcularValorEstampillasRequeridas(
        cotizacion.servicio.requiereEstampilla ?? false,
        String(cotizacion.valorServicio),
        denominacionesEstampilla,
      );
    } catch { /* sin stock suficiente — el cajero gestiona las estampillas físicamente */ }
    const esInternacional = dto.destinatario.pais && dto.destinatario.pais !== 'CO';

    // international: validate declared value ceiling
    if (esInternacional && dto.valorDeclarado) {
      validarValorDeclaradoIntl(String(dto.valorDeclarado));
    }

    const valorCertificacion = esInternacional ? 0 : cotizacion.valorCertificacion;

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
          '0',
          String(valorCertificacion),
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

    const clientePorDoc = !dto.clienteId && dto.remitente.documento && dto.remitente.tipoDocumento
      ? await this.repo.findClienteByDocumento(dto.remitente.tipoDocumento, dto.remitente.documento)
      : null;
    const clienteIdResuelto = dto.clienteId ?? clientePorDoc?.id;

    const envio = await this.repo.crearEnvio({
      sucursalId:           dto.sucursalId,
      sesionCajaId:         sesion.id,
      usuarioId,
      clienteId:            clienteIdResuelto,
      servicioId:           dto.servicioId,
      tipo:                 cotizacion.servicio.tipo,
      numeroGuia,
      remitenteNombre:      dto.remitente.nombre,
      remitenteDocumento:   dto.remitente.documento,
      remitenteEmail:       dto.remitente.email,
      remitenteTelefono:    dto.remitente.telefono,
      remitenteDireccion:   dto.remitente.direccion,
      remitenteCiudad:          dto.remitente.ciudad,
      remitenteDepartamento:    dto.remitente.departamento,
      remitenteCp:              dto.remitente.codigoPostal,
      destinatarioNombre:       dto.destinatario.nombre,
      destinatarioDocumento:    dto.destinatario.documento,
      destinatarioEmail:        dto.destinatario.email,
      destinatarioTelefono:     dto.destinatario.telefono,
      destinatarioDireccion:    dto.destinatario.direccion,
      destinatarioCiudad:       dto.destinatario.ciudad,
      destinatarioDepartamento: dto.destinatario.departamento,
      destinatarioPais:         dto.destinatario.pais,
      destinatarioCp:           dto.destinatario.codigoPostal,
      pesoFisicoKg:         dto.pesoFisicoKg,
      altoCm:               dto.altoCm,
      anchoCm:              dto.anchoCm,
      largoCm:              dto.largoCm,
      pesoVolumetricoKg:    cotizacion.pesoVolumetricoKg ?? undefined,
      pesoTarificadoKg:     cotizacion.pesoTarificadoKg,
      valorDeclarado:       dto.valorDeclarado,
      valorServicio:        cotizacion.valorServicio,
      valorEstampillas:     Number(estampillasResult.valorEstampillas),
      valorSeguro,
      valorCertificacion,
      valorTotal,
      medioPago:            dto.medioPago as any,
      contenido:            dto.contenido,
      observaciones:        dto.observaciones,
      esCorrespondencia:    dto.esCorrespondencia,
    });

    if (clienteIdResuelto) {
      await this._guardarDireccionesFrecuentes(clienteIdResuelto, dto);
    }

    const { movimiento, saldoActual, alertas } = await this.cajasService.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           'venta_servicio',
      monto:          String(valorTotal),
      medioPago:      dto.medioPago as any,
      referenciaId:   envio.id,
      referenciaTipo: 'Envio',
    });

    return { envio, cotizacion, movimiento, saldoActual, alertas, seleccionEstampillas: estampillasResult.seleccion };
  }

  // ── Guía PDF de envío individual ──────────────────────────────────────────────

  async getEnvioGuiaPdf(envioId: number): Promise<Buffer> {
    const envioRow = await this.prisma.envio.findUnique({
      where:  { idenvios: envioId },
      select: { pdf_guia_pathenvios: true, numero_guiaenvios: true, servicios_idservicios: true, sucursales_idsucursales: true },
    });
    if (!envioRow) throw new NotFoundException(`Envío ${envioId} no encontrado`);

    // Serve from disk if already generated
    if (envioRow.pdf_guia_pathenvios) {
      const exists = await this.storage.exists(envioRow.pdf_guia_pathenvios);
      if (exists) {
        const absPath = this.storage.absolutePath(envioRow.pdf_guia_pathenvios);
        return fs.promises.readFile(absPath);
      }
    }

    // Generate, store, and record the path
    const envio = await this.repo.findEnvioById(envioId);
    if (!envio) throw new NotFoundException(`Envío ${envioId} no encontrado`);

    const [servicio, sucursal] = await Promise.all([
      this.prisma.servicio.findUnique({
        where:  { idservicios: envioRow.servicios_idservicios },
        select: { nombreservicios: true },
      }),
      this.prisma.sucursal.findUnique({
        where:  { idsucursales: envioRow.sucursales_idsucursales },
        select: { codigosucursales: true, nombresucursales: true },
      }),
    ]);

    const svgBuffer = await generarGuiaEnvioSvg(
      envio,
      servicio?.nombreservicios ?? envio.tipo,
      { codigo: sucursal?.codigosucursales ?? '', nombre: sucursal?.nombresucursales ?? '' },
    );
    const buffer  = await svgToPdf(svgBuffer);
    const relPath = `guias/${envioRow.numero_guiaenvios}.pdf`;

    await this.storage.savePdf(relPath, buffer);
    await this.prisma.envio.update({
      where: { idenvios: envioId },
      data:  { pdf_guia_pathenvios: relPath, updated_atenvios: new Date() },
    });

    return buffer;
  }

  async getEnvioGuiaPdfPath(envioId: number): Promise<string | null> {
    const row = await this.prisma.envio.findUnique({
      where:  { idenvios: envioId },
      select: { pdf_guia_pathenvios: true },
    });
    if (!row?.pdf_guia_pathenvios) return null;
    const exists = await this.storage.exists(row.pdf_guia_pathenvios);
    return exists ? this.storage.absolutePath(row.pdf_guia_pathenvios) : null;
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
    if (!ventaFull) return;

    const totalesDetalle = calcularTotalesCarrito(
      (ventaFull.detalle ?? []).map(d => ({
        precioUnitario: d.precioUnitario,
        cantidad:       d.cantidad,
        descuento:      d.descuento,
        porcentajeTax:  d.porcentajeTax ?? 0,
      })),
    );

    const totalEnviosPendientes = (ventaFull.envios ?? []).reduce(
      (acc, e) => acc + e.valorTotal,
      0,
    );

    const totalApartadosPendientes = (ventaFull.apartadosPendientes ?? []).reduce(
      (acc, a) => acc + (a.valor ?? 0),
      0,
    );

    await this.repo.updateVentaTotales(ventaId, {
      medioPago: ventaFull.medioPago,
      subtotal:  totalesDetalle.subtotal,
      descuento: totalesDetalle.descuento,
      iva:       totalesDetalle.iva,
      total:     totalesDetalle.total + totalEnviosPendientes + totalApartadosPendientes,
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

  // ── Alertas: apartados por vencer y vencidos ──────────────────────────────

  async getAlertasApartados(sucursalId?: number) {
    const rows = await this.prisma.apartadoPostal.findMany({
      where: {
        deleted_atapartados_postales: null,
        ...(sucursalId && { sucursales_idsucursales: sucursalId }),
        estadoapartados_postales: { in: ['ocupado', 'vencido'] as any[] },
      },
      include: { sucursal: { select: { nombresucursales: true } } },
      orderBy: { fecha_finapartados_postales: 'asc' },
    });

    const proximos: object[] = [];
    const vencidos: object[] = [];

    for (const r of rows) {
      const fechaFin = r.fecha_finapartados_postales;
      const diasRestantes = fechaFin
        ? calcularDiasParaVencer(fechaFin.toISOString().split('T')[0])
        : null;

      const base = {
        id:             r.idapartados_postales,
        numero:         r.numeroapartados_postales,
        sucursalId:     r.sucursales_idsucursales,
        sucursalNombre: r.sucursal.nombresucursales,
        estado:         r.estadoapartados_postales,
        fechaFin:       fechaFin?.toISOString().split('T')[0] ?? null,
        diasRestantes,
      };

      if (r.estadoapartados_postales === 'vencido') {
        vencidos.push(base);
      } else if (diasRestantes !== null) {
        const alerta = evaluarAlertaVencimientoApartado(
          diasRestantes,
          r.dias_alerta_vencimientoapartados_postales,
          r.idapartados_postales,
          r.clientes_idclientes ?? 0,
          r.sucursales_idsucursales,
        );
        if (alerta.generarAlerta) proximos.push(base);
      }
    }

    return { proximos, vencidos };
  }

  // ── Alertas: anulaciones pendientes de aprobación ────────────────────────

  async getAnulacionesPendientes(sucursalId?: number) {
    const rows = await this.prisma.anulacion.findMany({
      where: {
        estadoanulaciones: 'pendiente',
        ...(sucursalId && {
          solicitante: { sucursales_idsucursales: sucursalId },
        }),
      },
      include: {
        solicitante: { select: { nombreusuarios: true, sucursales_idsucursales: true } },
      },
      orderBy: { created_atanulaciones: 'desc' },
    });

    return rows.map(r => ({
      id:                r.idanulaciones,
      referenciaId:      r.referencia_idanulaciones,
      referenciaTipo:    r.referencia_tipoanulaciones,
      motivo:            r.motivoanulaciones,
      estado:            r.estadoanulaciones,
      solicitanteNombre: r.solicitante?.nombreusuarios ?? null,
      sucursalId:        r.solicitante?.sucursales_idsucursales ?? null,
      createdAt:         r.created_atanulaciones,
    }));
  }

  async getDireccionesFrecuentes(clienteId: number, rol?: 'remitente' | 'destinatario') {
    return this.repo.findDireccionesFrecuentes(clienteId, rol);
  }

  async getDireccionesPorDocumento(documento: string, rol?: 'remitente' | 'destinatario') {
    return this.repo.findDireccionesPorDocumento(documento, rol);
  }

  async guardarDireccionManual(
    clienteId: number,
    data: {
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
    },
  ): Promise<void> {
    await this.repo.upsertDireccionFrecuente({ clienteId, ...data });
  }

  private async _guardarDireccionesFrecuentes(clienteId: number, dto: import('../dto/crear-envio.dto.js').CrearEnvioDto) {
    await Promise.all([
      this.repo.upsertDireccionFrecuente({
        clienteId,
        rol:         'remitente',
        nombre:      dto.remitente.nombre,
        empresa:     dto.remitente.empresa,
        telefono:    dto.remitente.telefono,
        email:       dto.remitente.email,
        ciudad:      dto.remitente.ciudad,
        pais:        dto.remitente.pais ?? 'CO',
        codigoPostal: dto.remitente.codigoPostal,
        documento:   dto.remitente.documento,
      }),
      this.repo.upsertDireccionFrecuente({
        clienteId,
        rol:         'destinatario',
        nombre:      dto.destinatario.nombre,
        empresa:     dto.destinatario.empresa,
        telefono:    dto.destinatario.telefono,
        email:       dto.destinatario.email,
        direccion:   dto.destinatario.direccion,
        ciudad:      dto.destinatario.ciudad,
        pais:        dto.destinatario.pais ?? 'CO',
        codigoPostal: dto.destinatario.codigoPostal,
        documento:   dto.destinatario.documento,
      }),
    ]);
  }

  // ── Recibo de venta en PDF ────────────────────────────────────────────────────

  async getVentaReciboPdf(ventaId: number, efectivoRecibido?: number): Promise<Buffer> {
    const venta = await this.prisma.venta.findUnique({
      where: { idventas: ventaId },
      include: {
        sesionCaja: {
          include: {
            caja: {
              include: {
                sucursal: {
                  select: { nombresucursales: true, direccionsucursales: true, telefonosucursales: true },
                },
              },
            },
            cajeroAsignado: { select: { nombreusuarios: true } },
          },
        },
        usuario: { select: { nombreusuarios: true } },
        cliente: {
          select: {
            nombreclientes: true,
            tipo_documentoclientes: true,
            numero_documentoclientes: true,
          },
        },
        detalle: {
          include: { producto: { select: { nombreproductos: true } } },
        },
      },
    });

    if (!venta) throw new NotFoundException(`Venta ${ventaId} no encontrada`);

    const sucursal = venta.sesionCaja.caja.sucursal;
    const cajero   = venta.sesionCaja.cajeroAsignado ?? venta.usuario;
    const cambio   = efectivoRecibido != null
      ? Math.max(0, efectivoRecibido - Number(venta.totalventas))
      : undefined;

    return generarReciboPdf({
      ventaId: venta.idventas,
      fecha:   venta.created_atventas,
      sucursal: {
        nombre:    sucursal.nombresucursales,
        direccion: sucursal.direccionsucursales ?? null,
        telefono:  sucursal.telefonosucursales  ?? null,
      },
      cajero: { nombre: cajero.nombreusuarios },
      caja:   { nombre: venta.sesionCaja.caja.nombrecajas },
      cliente: venta.cliente ? {
        nombre:    venta.cliente.nombreclientes,
        tipoDoc:   venta.cliente.tipo_documentoclientes,
        numeroDoc: venta.cliente.numero_documentoclientes,
      } : null,
      items: venta.detalle.map((d) => ({
        descripcion:    d.producto.nombreproductos,
        cantidad:       d.cantidadventas_detalle,
        precioUnitario: Number(d.precio_unitarioventas_detalle),
        descuento:      Number(d.descuentoventas_detalle),
        subtotal:       Number(d.subtotalventas_detalle),
      })),
      subtotal:         Number(venta.subtotalventas),
      descuento:        Number(venta.descuentoventas),
      iva:              Number(venta.ivaventas),
      total:            Number(venta.totalventas),
      medioPago:        venta.medio_pagoventas,
      efectivoRecibido,
      cambio,
    });
  }
}
