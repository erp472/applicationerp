import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, ParseIntPipe, HttpCode, HttpStatus, UseFilters, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { z } from 'zod';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';
import { InventarioService } from '../application/inventario.service.js';
import { AjusteInventarioSchema } from '../dto/ajuste-inventario.dto.js';
import { QueryInventarioSchema, QueryMovimientosSchema } from '../dto/query-inventario.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { InventarioDomainFilter } from './inventario-domain.filter.js';
import { InventarioPresenter } from './inventario.presenter.js';

const ROLES_READ  = ['CAJERO', 'USUARIO_POST', 'INVENTARIOS', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'] as const;
const ROLES_WRITE = ['INVENTARIOS', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'] as const;

const EntradaSchema = z.object({
  productoId:  z.number().int().positive(),
  cantidad:    z.number().int().positive(),
  observacion: z.string().max(500).optional(),
});

@ApiTags('inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(new InventarioDomainFilter())
@Controller('inventario')
export class InventarioController {
  constructor(private readonly service: InventarioService) {}

  @AuditKey('ADM-04')
  @Get('sucursales')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Lista de sucursales con alertas de stock' })
  listSucursales(@CurrentUser() user: { id: number; rol: string; sucursal_id: number | null }) {
    return this.service.getSucursales(user.rol, user.sucursal_id);
  }

  @AuditKey('ADM-04')
  @Get('alertas')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Resumen de alertas de stock por sucursal' })
  getAlertas(@CurrentUser() user: { id: number; rol: string; sucursal_id: number | null }) {
    return this.service.getAlertasResumen(user.rol, user.sucursal_id);
  }

  @AuditKey('ADM-04')
  @Get('sucursal/:sucursalId')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Stock de productos en una sucursal' })
  async listStock(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Query() rawQuery: unknown,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const query = QueryInventarioSchema.parse(rawQuery);
    const { datos, total } = await this.service.listStock(sucursalId, query, user.rol, user.sucursal_id);
    return { datos: InventarioPresenter.toStockList(datos), total };
  }

  @AuditKey('OPE-04')
  @Post('sucursal/:sucursalId/ajuste')
  @Roles(...ROLES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajuste de conteo físico' })
  async ajustar(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Body() rawBody: unknown,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const body = AjusteInventarioSchema.parse(rawBody);
    const item = await this.service.ajustar(sucursalId, body.productoId, body.cantidad_nueva, body.observacion, user.id, user.rol, user.sucursal_id);
    return InventarioPresenter.toStock(item);
  }

  @AuditKey('OPE-04')
  @Post('sucursal/:sucursalId/entrada')
  @Roles(...ROLES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar entrada de mercancía' })
  async entrada(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Body() rawBody: unknown,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const body = EntradaSchema.parse(rawBody);
    const item = await this.service.registrarEntrada(sucursalId, body.productoId, body.cantidad, body.observacion, user.id, user.rol, user.sucursal_id);
    return InventarioPresenter.toStock(item);
  }

  @AuditKey('ADM-04')
  @Get('sucursal/:sucursalId/movimientos')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Historial de movimientos de inventario' })
  async listMovimientos(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Query() rawQuery: unknown,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const query = QueryMovimientosSchema.parse(rawQuery);
    const { datos, total } = await this.service.listMovimientos(sucursalId, query, user.rol, user.sucursal_id);
    return { datos: datos.map(m => InventarioPresenter.toMovimiento(m)), total };
  }

  // ── Órdenes de inventario ────────────────────────────────────────────────

  @AuditKey('ADM-04')
  @Get('ordenes')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Listar órdenes de inventario' })
  async listOrdenes(
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
    @Query('sucursalId') sucursalIdRaw?: string,
    @Query('estado')     estado?: string,
  ) {
    const sucursalId = sucursalIdRaw
      ? Number(sucursalIdRaw)
      : user.sucursal_id ?? undefined;
    return this.service.listOrdenes(sucursalId, estado);
  }

  @AuditKey('ADM-04')
  @Get('ordenes/pendientes')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Órdenes pendientes de confirmación — alerta orden_inventario' })
  async getOrdenesPendientes(
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
    @Query('sucursalId') sucursalIdRaw?: string,
  ) {
    const sucursalId = sucursalIdRaw
      ? Number(sucursalIdRaw)
      : user.sucursal_id ?? undefined;
    return this.service.getOrdenesPendientes(sucursalId);
  }

  @AuditKey('OPE-01')
  @Post('ordenes')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Crear orden de reposición de inventario' })
  async crearOrden(
    @Body() body: unknown,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const OrdenSchema = z.object({
      sucursalId: z.number().int().positive(),
      items: z.array(z.object({
        productoId:      z.number().int().positive(),
        cantidadEnviada: z.number().int().positive(),
      })).min(1),
    });
    const parsed = OrdenSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.crearOrden(parsed.data.sucursalId, parsed.data.items, user.id);
  }

  @AuditKey('OPE-04')
  @Patch('ordenes/:id/estado')
  @Roles(...ROLES_WRITE)
  @ApiOperation({ summary: 'Actualizar estado de una orden (confirmada / rechazada / parcial)' })
  async actualizarEstadoOrden(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const EstadoSchema = z.object({
      estado: z.enum(['confirmada', 'rechazada', 'parcial']),
    });
    const parsed = EstadoSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.service.actualizarEstadoOrden(id, parsed.data.estado, user.id);
  }
}
