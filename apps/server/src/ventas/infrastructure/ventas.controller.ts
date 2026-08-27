import {
  Controller, Get, Post, Patch, Delete, Put,
  Body, Param, Query, Res, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse,
} from '@nestjs/swagger';
import { VentasService }          from '../application/ventas.service.js';
import { IniciarVentaSchema }        from '../dto/iniciar-venta.dto.js';
import { AgregarProductoSchema }     from '../dto/agregar-producto.dto.js';
import { ConfirmarVentaSchema }      from '../dto/confirmar-venta.dto.js';
import { AnularVentaSchema }         from '../dto/anular-venta.dto.js';
import { SetTarifasEspecialSchema }  from '../dto/set-tarifas-especial.dto.js';
import { ContratarApartadoSchema }         from '../dto/contratar-apartado.dto.js';
import { AgregarApartadoCarritoSchema }    from '../dto/agregar-apartado-carrito.dto.js';
import { RenovarApartadoSchema }     from '../dto/renovar-apartado.dto.js';
import { CrearApartadoAdminSchema }  from '../dto/crear-apartado-admin.dto.js';
import { UpdateApartadoAdminSchema } from '../dto/update-apartado-admin.dto.js';
import { CrearEnvioSchema }          from '../dto/crear-envio.dto.js';
import { GuardarDireccionSchema }    from '../dto/guardar-direccion.dto.js';
import { JwtAuthGuard }           from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard }       from '../../common/guards/feature-flag.guard.js';
import { RolesGuard }             from '../../common/guards/roles.guard.js';
import { Roles }                  from '../../common/decorators/roles.decorator.js';
import { Feature }                from '../../common/decorators/feature.decorator.js';
import { CurrentUser }            from '../../common/decorators/current-user.decorator.js';
import { VentasPresenter }        from './ventas.presenter.js';
import { VentasDomainFilter }     from './ventas-domain.filter.js';
import type { TipoProducto }      from '../domain/venta.entity.js';

// Solo CAJERO hace ventas — SUPERVISOR_REGIONAL no opera la caja auxiliar
const ROLES_CAJERO     = ['CAJERO', 'ADMIN_SISTEMA'];
// SUPERVISOR puede anular como autorización, no como operador de venta
const ROLES_SUPERVISOR = ['SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_READ       = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'];

@ApiTags('ventas')
@ApiBearerAuth()
@Controller('ventas')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo:ventas')
@UseFilters(new VentasDomainFilter())
export class VentasController {
  constructor(private readonly service: VentasService) {}

  // ── Catálogo ─────────────────────────────────────────────────────────────────

  @Get('punto/:cajaId/estampillas-disponibles')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Estampillas disponibles por denominación y serie (para preporteado)' })
  @ApiParam({ name: 'cajaId', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de denominaciones con stock y serie' })
  async getEstampillasDisponibles(@Param('cajaId', ParseIntPipe) cajaId: number) {
    return this.service.getEstampillasDisponibles(cajaId);
  }

  @Get('catalogo/productos')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Catálogo de productos disponibles en la sucursal' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: true })
  @ApiQuery({ name: 'tipo', required: false, enum: ['estampilla', 'filatelia', 'empaque', 'material_oficina', 'giro', 'paquete', 'otro'] })
  async getCatalogo(
    @Query('sucursalId', ParseIntPipe) sucursalId: number,
    @Query('tipo') tipo?: string,
  ) {
    const productos = await this.service.getCatalogo(sucursalId, tipo as TipoProducto | undefined);
    return productos.map(VentasPresenter.toProducto);
  }

  @Get('catalogo/especiales/:productoId/tarifas')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Tarifas por rango de cantidad para un servicio especial' })
  @ApiParam({ name: 'productoId', type: Number })
  async getTarifasEspecial(@Param('productoId', ParseIntPipe) productoId: number) {
    return this.service.getTarifasEspecial(productoId);
  }

  @Put('catalogo/especiales/:productoId/tarifas')
  @Roles('INVENTARIOS', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL')
  @ApiOperation({ summary: 'Reemplaza todas las tarifas por cantidad de un servicio especial (admin)' })
  @ApiParam({ name: 'productoId', type: Number })
  async setTarifasEspecial(
    @Param('productoId', ParseIntPipe) productoId: number,
    @Body() body: unknown,
  ) {
    const parsed = SetTarifasEspecialSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.setTarifasEspecial(productoId, parsed.data);
  }

  // ── Clientes ──────────────────────────────────────────────────────────────────

  @Get('clientes/buscar')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Buscar cliente por tipo y número de documento' })
  @ApiQuery({ name: 'tipo',   required: true })
  @ApiQuery({ name: 'numero', required: true })
  async buscarCliente(
    @Query('tipo')   tipo: string,
    @Query('numero') numero: string,
  ) {
    const cliente = await this.service.buscarCliente(tipo, numero);
    return cliente ? VentasPresenter.toCliente(cliente) : null;
  }

  @Get('clientes/:clienteId/saldo-a-favor')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Consultar saldo a favor acumulado del cliente (por compras filatelia)' })
  @ApiParam({ name: 'clienteId', type: Number })
  async getSaldoAFavor(@Param('clienteId', ParseIntPipe) clienteId: number) {
    return this.service.getSaldoAFavor(clienteId);
  }

  @Get('clientes/:clienteId/direcciones')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Direcciones frecuentes del cliente en envíos anteriores' })
  @ApiParam({ name: 'clienteId', type: Number })
  @ApiQuery({ name: 'rol', required: false, enum: ['remitente', 'destinatario'] })
  async getDireccionesFrecuentes(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Query('rol') rol?: string,
  ) {
    const rolVal = (rol === 'remitente' || rol === 'destinatario') ? rol : undefined;
    return this.service.getDireccionesFrecuentes(clienteId, rolVal);
  }

  @Post('clientes/:clienteId/direcciones')
  @Roles(...ROLES_READ)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Guardar dirección frecuente manualmente' })
  @ApiParam({ name: 'clienteId', type: Number })
  async guardarDireccionManual(
    @Param('clienteId', ParseIntPipe) clienteId: number,
    @Body() body: unknown,
  ) {
    const parsed = GuardarDireccionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    await this.service.guardarDireccionManual(clienteId, parsed.data);
  }

  @Get('direcciones')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Direcciones frecuentes por número de documento del destinatario/remitente' })
  @ApiQuery({ name: 'documento', required: true, description: 'Número de documento (CC, NIT, etc.)' })
  @ApiQuery({ name: 'rol', required: false, enum: ['remitente', 'destinatario'] })
  async getDireccionesPorDocumento(
    @Query('documento') documento: string,
    @Query('rol')       rol?: string,
  ) {
    if (!documento?.trim()) return [];
    const rolVal = (rol === 'remitente' || rol === 'destinatario') ? rol : undefined;
    return this.service.getDireccionesPorDocumento(documento.trim(), rolVal);
  }

  // ── Iniciar venta ─────────────────────────────────────────────────────────────

  @Post('punto/:cajaId/iniciar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Iniciar venta en caja auxiliar — busca/vincula cliente y crea el carrito' })
  @ApiParam({ name: 'cajaId', type: Number })
  @ApiResponse({ status: 201, description: 'Venta iniciada con ventaId para el carrito' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 409, description: 'La caja no tiene sesión activa' })
  async iniciarVenta(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number; rol: string },
  ) {
    const parsed = IniciarVentaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { venta, cliente } = await this.service.iniciarVenta(cajaId, parsed.data, user.id, user.rol);
    return { venta: VentasPresenter.toVenta(venta), cliente: VentasPresenter.toCliente(cliente) };
  }

  // ── Carrito ───────────────────────────────────────────────────────────────────

  @Get(':ventaId/carrito')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Ver carrito actual con todos los ítems y totales' })
  @ApiParam({ name: 'ventaId', type: Number })
  async getCarrito(@Param('ventaId', ParseIntPipe) ventaId: number) {
    return VentasPresenter.toVenta(await this.service.getCarrito(ventaId));
  }

  @Post(':ventaId/carrito/producto')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Agregar producto al carrito' })
  @ApiParam({ name: 'ventaId', type: Number })
  @ApiQuery({ name: 'cajaId', type: Number, required: true })
  @ApiResponse({ status: 201, description: 'Producto agregado, totales recalculados' })
  async agregarProducto(
    @Param('ventaId', ParseIntPipe) ventaId: number,
    @Query('cajaId', ParseIntPipe)  cajaId:  number,
    @Body() body: unknown,
  ) {
    const parsed = AgregarProductoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.agregarProducto(ventaId, parsed.data, cajaId);
    return { detalle: VentasPresenter.toDetalle(result.detalle), nombreProducto: result.nombreProducto };
  }

  @Delete(':ventaId/carrito/:detalleId')
  @Roles(...ROLES_CAJERO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar ítem del carrito' })
  @ApiParam({ name: 'ventaId',  type: Number })
  @ApiParam({ name: 'detalleId', type: Number })
  async eliminarProducto(
    @Param('ventaId',  ParseIntPipe) ventaId:  number,
    @Param('detalleId', ParseIntPipe) detalleId: number,
  ) {
    await this.service.eliminarProducto(ventaId, detalleId);
  }

  @Post(':ventaId/carrito/envio')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Agregar servicio postal al carrito — crea guía en estado pendiente, se factura al confirmar la venta' })
  @ApiParam({ name: 'ventaId', type: Number })
  @ApiQuery({ name: 'cajaId', type: Number, required: true })
  @ApiResponse({ status: 201, description: 'Envío agregado al carrito. numeroGuia pre-asignado, estado=pendiente.' })
  async agregarEnvioAlCarrito(
    @Param('ventaId', ParseIntPipe) ventaId: number,
    @Query('cajaId', ParseIntPipe)  cajaId:  number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = CrearEnvioSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.agregarEnvioAlCarrito(ventaId, cajaId, user.id, parsed.data);
    return {
      envio:                VentasPresenter.toEnvio(result.envio),
      guia:                 VentasPresenter.toGuia(result.envio, result.cotizacion.servicio?.nombre, result.cotizacion.fechaEntregaEstimada?.toISOString() ?? null),
      cotizacion:           { pesoTarificadoKg: result.cotizacion.pesoTarificadoKg, valorServicio: result.cotizacion.valorServicio },
      numeroGuia:           result.numeroGuia,
      estado:               'pendiente',
      seleccionEstampillas: result.seleccionEstampillas,
    };
  }

  @Delete(':ventaId/carrito/envio/:envioId')
  @Roles(...ROLES_CAJERO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar envío pendiente del carrito' })
  @ApiParam({ name: 'ventaId', type: Number })
  @ApiParam({ name: 'envioId', type: Number })
  async eliminarEnvioDelCarrito(
    @Param('ventaId', ParseIntPipe) ventaId: number,
    @Param('envioId', ParseIntPipe) envioId: number,
  ) {
    await this.service.eliminarEnvioDelCarrito(ventaId, envioId);
  }

  // ── Confirmar pago ────────────────────────────────────────────────────────────

  @Post(':ventaId/confirmar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Confirmar pago — registra MovimientoCaja, factura envíos pendientes y genera guías' })
  @ApiParam({ name: 'ventaId', type: Number })
  @ApiQuery({ name: 'cajaId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Venta confirmada. Retorna cambio + saldo + alertas + guias (si había envíos en carrito).' })
  @ApiResponse({ status: 422, description: 'Carrito vacío' })
  async confirmarVenta(
    @Param('ventaId', ParseIntPipe) ventaId: number,
    @Query('cajaId', ParseIntPipe)  cajaId:  number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = ConfirmarVentaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.confirmarVenta(ventaId, parsed.data, cajaId, user.id);
    return {
      venta:       VentasPresenter.toVenta(result.venta),
      movimiento:  result.movimiento,
      saldoActual: result.saldoActual,
      alertas:     result.alertas,
      cambio:      result.cambio,
      guias:       result.guias.map((e) => VentasPresenter.toGuia(e)),
    };
  }

  // ── Anular factura ────────────────────────────────────────────────────────────

  @Post(':ventaId/anular')
  @Roles(...ROLES_SUPERVISOR)
  @ApiOperation({ summary: 'Anular venta — reversa el movimiento de caja y libera recursos' })
  @ApiParam({ name: 'ventaId', type: Number })
  @ApiQuery({ name: 'cajaId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Venta anulada. Movimiento de anulación registrado.' })
  async anularVenta(
    @Param('ventaId', ParseIntPipe) ventaId: number,
    @Query('cajaId', ParseIntPipe)  cajaId:  number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = AnularVentaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.anularVenta(ventaId, parsed.data, cajaId, user.id);
    return {
      venta:       VentasPresenter.toVenta(result.venta),
      movimiento:  result.movimiento,
      saldoActual: result.saldoActual,
      alertas:     result.alertas,
      motivo:      result.motivo,
    };
  }

  // ── Apartado Postal en carrito ────────────────────────────────────────────────

  @Post(':ventaId/carrito/apartado')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Agregar apartado postal al carrito — reserva y suma al total de la venta' })
  @ApiParam({ name: 'ventaId', type: Number })
  @ApiQuery({ name: 'cajaId', type: Number, required: true })
  @ApiQuery({ name: 'clienteId', type: Number, required: true })
  @ApiResponse({ status: 201, description: 'Apartado reservado y agregado al carrito' })
  @ApiResponse({ status: 409, description: 'Apartado no disponible' })
  async agregarApartadoAlCarrito(
    @Param('ventaId',             ParseIntPipe) ventaId:   number,
    @Query('cajaId',    ParseIntPipe)           cajaId:    number,
    @Query('clienteId', ParseIntPipe)           clienteId: number,
    @Body() body: unknown,
  ) {
    const parsed = AgregarApartadoCarritoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.agregarApartadoAlCarrito(ventaId, cajaId, clienteId, parsed.data);
    return { apartado: VentasPresenter.toApartado(result.apartado), cotizacion: result.cotizacion };
  }

  @Delete(':ventaId/carrito/apartado/:apartadoId')
  @Roles(...ROLES_CAJERO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar apartado reservado del carrito — libera el apartado' })
  @ApiParam({ name: 'ventaId', type: Number })
  @ApiParam({ name: 'apartadoId', type: Number })
  async eliminarApartadoDelCarrito(
    @Param('ventaId',    ParseIntPipe) ventaId:    number,
    @Param('apartadoId', ParseIntPipe) apartadoId: number,
  ) {
    await this.service.eliminarApartadoDelCarrito(ventaId, apartadoId);
  }

  // ── Apartado Postal ───────────────────────────────────────────────────────────

  @Get('apartados/disponibles')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Apartados postales disponibles en una sucursal' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: true })
  @ApiQuery({ name: 'tamano', required: false, enum: ['pequeno', 'mediano', 'grande'] })
  async getApartadosDisponibles(
    @Query('sucursalId', ParseIntPipe) sucursalId: number,
    @Query('tamano') tamano?: string,
  ) {
    return this.service.getApartadosDisponibles(sucursalId, tamano);
  }

  @Get('apartados/todos')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Todos los apartados postales de una sucursal (cualquier estado)' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: true })
  @ApiQuery({ name: 'tamano', required: false, enum: ['pequeno', 'mediano', 'grande'] })
  async getApartadosPorSucursal(
    @Query('sucursalId', ParseIntPipe) sucursalId: number,
    @Query('tamano') tamano?: string,
  ) {
    return this.service.getApartadosPorSucursal(sucursalId, tamano);
  }

  @Post('punto/:cajaId/apartado')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Contratar apartado postal — registra MovimientoCaja tipo apartado_postal' })
  @ApiParam({ name: 'cajaId', type: Number })
  @ApiQuery({ name: 'clienteId', type: Number, required: true })
  @ApiResponse({ status: 201, description: 'Apartado contratado y movimiento registrado' })
  @ApiResponse({ status: 409, description: 'Apartado ya ocupado' })
  async contratarApartado(
    @Param('cajaId', ParseIntPipe)    cajaId:    number,
    @Query('clienteId', ParseIntPipe) clienteId: number,
    @Body() body: unknown,
  ) {
    const parsed = ContratarApartadoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.contratarApartado(cajaId, clienteId, parsed.data);
    return {
      apartado:    result.apartado,
      movimiento:  result.movimiento,
      saldoActual: result.saldoActual,
      alertas:     result.alertas,
    };
  }

  @Post('punto/:cajaId/apartado/:id/renovar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Renovar apartado postal — extiende fechaFin y registra cobro en caja' })
  @ApiParam({ name: 'cajaId', type: Number })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Apartado renovado y movimiento registrado' })
  @ApiResponse({ status: 404, description: 'Apartado no encontrado' })
  @ApiResponse({ status: 409, description: 'Apartado no está ocupado' })
  async renovarApartado(
    @Param('cajaId', ParseIntPipe) cajaId:     number,
    @Param('id',     ParseIntPipe) apartadoId: number,
    @Body() body: unknown,
  ) {
    const parsed = RenovarApartadoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.renovarApartado(cajaId, apartadoId, parsed.data);
    return {
      apartado:    result.apartado,
      renovacion:  result.renovacion,
      movimiento:  result.movimiento,
      saldoActual: result.saldoActual,
      alertas:     result.alertas,
    };
  }

  // ── Servicios Postales ────────────────────────────────────────────────────────

  @Get('servicios-postales')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Catálogo de servicios postales disponibles en la sucursal' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: true })
  async getServiciosPostales(@Query('sucursalId', ParseIntPipe) sucursalId: number) {
    return this.service.getServiciosPostales(sucursalId);
  }

  @Get('servicios-postales/:servicioId/paises-destino')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Lista de países de destino con tarifas configuradas para el servicio' })
  @ApiParam({ name: 'servicioId', type: Number })
  async getPaisesDestino(@Param('servicioId', ParseIntPipe) servicioId: number) {
    return this.service.getPaisesDestinoByServicio(servicioId);
  }

  @Get('conversion-moneda')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Convertir COP a USD usando TRM del día' })
  @ApiQuery({ name: 'valorCop', type: Number, required: true })
  @ApiQuery({ name: 'trmDia',   type: Number, required: true })
  conversionMoneda(
    @Query('valorCop') valorCopS: string,
    @Query('trmDia')   trmDiaS:   string,
  ) {
    return this.service.conversionMoneda(Number(valorCopS), Number(trmDiaS));
  }

  @Get('servicios-postales/cotizar')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Cotizar tarifa de envío según servicio, peso y dimensiones' })
  @ApiQuery({ name: 'servicioId',   type: Number,  required: true })
  @ApiQuery({ name: 'pesoFisicoKg', type: Number,  required: true })
  @ApiQuery({ name: 'altoCm',       type: Number,  required: false })
  @ApiQuery({ name: 'anchoCm',      type: Number,  required: false })
  @ApiQuery({ name: 'largoCm',      type: Number,  required: false })
  @ApiQuery({ name: 'paisDestino',       required: false })
  @ApiQuery({ name: 'ciudadDestino',  required: false })
  @ApiQuery({ name: 'tipoTrayecto',   required: false, enum: ['URBANO','NACIONAL','ESPECIAL'], description: 'Tipo de trayecto para servicios nacionales (reemplaza ciudadDestino en lookup de tarifa)' })
  @ApiQuery({ name: 'porcentajeArancel', type: Number, required: false, description: 'Porcentaje arancel destino — retorna estimado aduana en USD' })
  @ApiQuery({ name: 'trmDia',            type: Number, required: false, description: 'TRM del día para conversión COP→USD en estimado de aduana' })
  async cotizarEnvio(
    @Query('servicioId',      ParseIntPipe)  servicioId:     number,
    @Query('pesoFisicoKg')   pesoFisicoKgS: string,
    @Query('altoCm')          altoCmS?:      string,
    @Query('anchoCm')         anchoCmS?:     string,
    @Query('largoCm')         largoCmS?:     string,
    @Query('paisDestino')     paisDestino = 'CO',
    @Query('ciudadDestino')   ciudadDestino?: string,
    @Query('tipoTrayecto')    tipoTrayecto?: 'URBANO' | 'NACIONAL' | 'ESPECIAL',
    @Query('porcentajeArancel') porcentajeArancelS?: string,
    @Query('trmDia')            trmDiaS?:            string,
  ) {
    return this.service.cotizarEnvio(
      servicioId,
      Number(pesoFisicoKgS),
      altoCmS  ? Number(altoCmS)  : undefined,
      anchoCmS ? Number(anchoCmS) : undefined,
      largoCmS ? Number(largoCmS) : undefined,
      paisDestino,
      ciudadDestino,
      porcentajeArancelS ? Number(porcentajeArancelS) : undefined,
      trmDiaS            ? Number(trmDiaS)            : undefined,
      tipoTrayecto,
    );
  }

  @Post('punto/:cajaId/envio')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Crear guía postal — registra MovimientoCaja tipo venta_servicio' })
  @ApiParam({ name: 'cajaId', type: Number })
  @ApiResponse({ status: 201, description: 'Guía creada con número único. Saldo y alertas de caja incluidos.' })
  @ApiResponse({ status: 422, description: 'Sin tarifa para el peso/destino indicado' })
  async crearEnvio(
    @Param('cajaId', ParseIntPipe) cajaId: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number },
  ) {
    const parsed = CrearEnvioSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.crearEnvio(cajaId, user.id, parsed.data);
    return {
      guia:                 VentasPresenter.toGuia(result.envio, result.cotizacion.servicio?.nombre, result.cotizacion.fechaEntregaEstimada?.toISOString() ?? null),
      envio:                VentasPresenter.toEnvio(result.envio),
      cotizacion:           { pesoTarificadoKg: result.cotizacion.pesoTarificadoKg, valorServicio: result.cotizacion.valorServicio },
      movimiento:           result.movimiento,
      saldoActual:          result.saldoActual,
      alertas:              result.alertas,
      seleccionEstampillas: result.seleccionEstampillas,
    };
  }

  // ── Ventas del día por sucursal ───────────────────────────────────────────────

  @Get('sucursal/:sucursalId/dia')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Ventas confirmadas del día en una sucursal (con detalle de productos)' })
  @ApiParam({ name: 'sucursalId', type: Number })
  async getVentasDia(@Param('sucursalId', ParseIntPipe) sucursalId: number) {
    return this.service.getVentasDia(sucursalId);
  }

  // ── Resumen del turno ─────────────────────────────────────────────────────────

  @Get('punto/:cajaId/resumen')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Resumen de ventas del turno activo por categoría (sellos, apartados, servicios, productos)' })
  @ApiParam({ name: 'cajaId', type: Number })
  @ApiResponse({ status: 200, description: 'Totales agrupados por tipo de movimiento para el turno activo' })
  async getResumenTurno(@Param('cajaId', ParseIntPipe) cajaId: number) {
    return this.service.getResumenTurno(cajaId);
  }

  // ── Listado del turno ─────────────────────────────────────────────────────────

  @Get('punto/:cajaId/turno')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Movimientos globales del turno activo — incluye ventas, apartados, servicios y anulaciones' })
  @ApiParam({ name: 'cajaId', type: Number })
  async listMovimientosTurno(@Param('cajaId', ParseIntPipe) cajaId: number) {
    return this.service.listMovimientosTurno(cajaId);
  }

  // ── Admin CRUD Apartados ──────────────────────────────────────────────────────

  @Get('admin/apartados')
  @Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL')
  @ApiOperation({ summary: 'Listar todos los apartados postales (admin)' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: false })
  @ApiQuery({ name: 'estado',     type: String, required: false, enum: ['disponible', 'ocupado', 'vencido', 'mantenimiento'] })
  @ApiQuery({ name: 'tamano',     type: String, required: false, enum: ['pequeno', 'mediano', 'grande'] })
  async listApartadosAdmin(
    @Query('sucursalId') sucursalIdRaw?: string,
    @Query('estado')     estado?: string,
    @Query('tamano')     tamano?: string,
  ) {
    const sucursalId = sucursalIdRaw ? Number(sucursalIdRaw) : undefined;
    return this.service.listApartadosAdmin({ sucursalId, estado, tamano });
  }

  @Post('admin/apartados')
  @Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL')
  @ApiOperation({ summary: 'Crear apartado postal' })
  @ApiResponse({ status: 201, description: 'Apartado creado' })
  @ApiResponse({ status: 409, description: 'Número duplicado en la sucursal' })
  async createApartadoAdmin(@Body() body: unknown) {
    const parsed = CrearApartadoAdminSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.createApartadoAdmin(parsed.data);
  }

  @Patch('admin/apartados/:id')
  @Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL')
  @ApiOperation({ summary: 'Actualizar tamaño, estado o días de alerta de un apartado' })
  @ApiParam({ name: 'id', type: Number })
  async updateApartadoAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const parsed = UpdateApartadoAdminSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.updateApartadoAdmin(id, parsed.data);
  }

  @Delete('admin/apartados/:id')
  @Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar (soft) un apartado — solo si está disponible o en mantenimiento' })
  @ApiParam({ name: 'id', type: Number })
  async deleteApartadoAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteApartadoAdmin(id);
  }

  // ── Alertas ───────────────────────────────────────────────────────────────

  @Get('alertas/apartados')
  @Roles('SUPERVISOR_REGIONAL', 'ADMIN_NACIONAL', 'ADMIN_SISTEMA')
  @ApiOperation({ summary: 'Apartados próximos a vencer y vencidos — para Dashboard de alertas' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: false })
  async getAlertasApartados(
    @Query('sucursalId') sucursalIdRaw?: string,
    @CurrentUser() user?: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const sucursalId = sucursalIdRaw
      ? Number(sucursalIdRaw)
      : user?.rol === 'SUPERVISOR_REGIONAL'
        ? (user.sucursal_id ?? undefined)
        : undefined;
    return this.service.getAlertasApartados(sucursalId);
  }

  @Get('alertas/anulaciones')
  @Roles('SUPERVISOR_REGIONAL', 'ADMIN_NACIONAL', 'ADMIN_SISTEMA')
  @ApiOperation({ summary: 'Anulaciones pendientes de aprobación — para Dashboard de alertas' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: false })
  async getAnulacionesPendientes(
    @Query('sucursalId') sucursalIdRaw?: string,
    @CurrentUser() user?: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const sucursalId = sucursalIdRaw
      ? Number(sucursalIdRaw)
      : user?.rol === 'SUPERVISOR_REGIONAL'
        ? (user.sucursal_id ?? undefined)
        : undefined;
    return this.service.getAnulacionesPendientes(sucursalId);
  }

  // ── Guía PDF de envío individual ──────────────────────────────────────────────

  @Get('envios/:envioId/guia-pdf')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Descargar guía postal individual en PDF' })
  @ApiParam({ name: 'envioId', type: Number })
  async descargarGuiaEnvioPdf(
    @Param('envioId', ParseIntPipe) envioId: number,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.service.getEnvioGuiaPdf(envioId);
    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="guia-${envioId}.pdf"`)
      .send(buffer);
  }
}
