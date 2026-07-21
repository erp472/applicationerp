import {
  Controller, Get, Post, Delete,
  Body, Param, Query, UseGuards, UseFilters,
  ParseIntPipe, BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse,
} from '@nestjs/swagger';
import { VentasService }          from '../application/ventas.service.js';
import { IniciarVentaSchema }        from '../dto/iniciar-venta.dto.js';
import { AgregarProductoSchema }     from '../dto/agregar-producto.dto.js';
import { ConfirmarVentaSchema }      from '../dto/confirmar-venta.dto.js';
import { AnularVentaSchema }         from '../dto/anular-venta.dto.js';
import { ContratarApartadoSchema }   from '../dto/contratar-apartado.dto.js';
import { CrearEnvioSchema }          from '../dto/crear-envio.dto.js';
import { JwtAuthGuard }           from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard }       from '../../common/guards/feature-flag.guard.js';
import { RolesGuard }             from '../../common/guards/roles.guard.js';
import { Roles }                  from '../../common/decorators/roles.decorator.js';
import { Feature }                from '../../common/decorators/feature.decorator.js';
import { CurrentUser }            from '../../common/decorators/current-user.decorator.js';
import { VentasPresenter }        from './ventas.presenter.js';
import { VentasDomainFilter }     from './ventas-domain.filter.js';
import type { TipoProducto }      from '../domain/venta.entity.js';

const ROLES_CAJERO     = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_SUPERVISOR = ['SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA'];
const ROLES_READ       = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'];

@ApiTags('ventas')
@ApiBearerAuth()
@Controller('ventas')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@Feature('modulo_ventas')
@UseFilters(new VentasDomainFilter())
export class VentasController {
  constructor(private readonly service: VentasService) {}

  // ── Catálogo ─────────────────────────────────────────────────────────────────

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
    @CurrentUser() user: { id: number },
  ) {
    const parsed = IniciarVentaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { venta, cliente } = await this.service.iniciarVenta(cajaId, parsed.data, user.id);
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

  // ── Confirmar pago ────────────────────────────────────────────────────────────

  @Post(':ventaId/confirmar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Confirmar pago — registra MovimientoCaja en la caja auxiliar' })
  @ApiParam({ name: 'ventaId', type: Number })
  @ApiQuery({ name: 'cajaId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Venta confirmada. Retorna cambio (si efectivo) + saldo actualizado + alertas.' })
  @ApiResponse({ status: 422, description: 'Carrito vacío' })
  async confirmarVenta(
    @Param('ventaId', ParseIntPipe) ventaId: number,
    @Query('cajaId', ParseIntPipe)  cajaId:  number,
    @Body() body: unknown,
  ) {
    const parsed = ConfirmarVentaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.confirmarVenta(ventaId, parsed.data, cajaId);
    return {
      venta:       VentasPresenter.toVenta(result.venta),
      movimiento:  result.movimiento,
      saldoActual: result.saldoActual,
      alertas:     result.alertas,
      cambio:      result.cambio,
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
  ) {
    const parsed = AnularVentaSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const result = await this.service.anularVenta(ventaId, parsed.data, cajaId);
    return {
      venta:       VentasPresenter.toVenta(result.venta),
      movimiento:  result.movimiento,
      saldoActual: result.saldoActual,
      alertas:     result.alertas,
      motivo:      result.motivo,
    };
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

  // ── Servicios Postales ────────────────────────────────────────────────────────

  @Get('servicios-postales')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Catálogo de servicios postales disponibles en la sucursal' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: true })
  async getServiciosPostales(@Query('sucursalId', ParseIntPipe) sucursalId: number) {
    return this.service.getServiciosPostales(sucursalId);
  }

  @Get('servicios-postales/cotizar')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Cotizar tarifa de envío según servicio, peso y dimensiones' })
  @ApiQuery({ name: 'servicioId',   type: Number,  required: true })
  @ApiQuery({ name: 'pesoFisicoKg', type: Number,  required: true })
  @ApiQuery({ name: 'altoCm',       type: Number,  required: false })
  @ApiQuery({ name: 'anchoCm',      type: Number,  required: false })
  @ApiQuery({ name: 'largoCm',      type: Number,  required: false })
  @ApiQuery({ name: 'paisDestino',  required: false })
  async cotizarEnvio(
    @Query('servicioId',   ParseIntPipe)  servicioId:   number,
    @Query('pesoFisicoKg') pesoFisicoKgS: string,
    @Query('altoCm')       altoCmS?:      string,
    @Query('anchoCm')      anchoCmS?:     string,
    @Query('largoCm')      largoCmS?:     string,
    @Query('paisDestino')  paisDestino = 'CO',
  ) {
    return this.service.cotizarEnvio(
      servicioId,
      Number(pesoFisicoKgS),
      altoCmS  ? Number(altoCmS)  : undefined,
      anchoCmS ? Number(anchoCmS) : undefined,
      largoCmS ? Number(largoCmS) : undefined,
      paisDestino,
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
      envio:       result.envio,
      cotizacion:  { pesoTarificadoKg: result.cotizacion.pesoTarificadoKg, valorServicio: result.cotizacion.valorServicio },
      movimiento:  result.movimiento,
      saldoActual: result.saldoActual,
      alertas:     result.alertas,
    };
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
}
