import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { z } from 'zod';
import { InventarioService } from './inventario.service.js';
import { AjusteInventarioSchema } from './dto/ajuste-inventario.dto.js';
import { QueryInventarioSchema, QueryMovimientosSchema } from './dto/query-inventario.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

const ROLES_READ  = ['INVENTARIOS', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'] as const;
const ROLES_WRITE = ['INVENTARIOS', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'] as const;

const EntradaInventarioSchema = z.object({
  productoId:  z.number().int().positive(),
  cantidad:    z.number().int().positive('La cantidad debe ser mayor a 0'),
  observacion: z.string().max(500).optional(),
});

@ApiTags('inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventario: InventarioService) {}

  @Get('sucursales')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Lista de sucursales con conteo de alertas de stock' })
  async listSucursales(
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    return this.inventario.getSucursales(user.rol, user.sucursal_id);
  }

  @Get('alertas')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Resumen de alertas de stock por sucursal' })
  async getAlertas(
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    return this.inventario.getAlertasResumen(user.rol, user.sucursal_id);
  }

  @Get('sucursal/:sucursalId')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Stock de productos en una sucursal' })
  async listStock(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Query() rawQuery: unknown,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const query = QueryInventarioSchema.parse(rawQuery);
    return this.inventario.listStock(sucursalId, query, user.rol, user.sucursal_id);
  }

  @Post('sucursal/:sucursalId/ajuste')
  @Roles(...ROLES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajuste de conteo físico de un producto' })
  async ajustar(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Body() rawBody: unknown,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const body = AjusteInventarioSchema.parse(rawBody);
    return this.inventario.ajustar(
      sucursalId,
      body.productoId,
      body.cantidad_nueva,
      body.observacion,
      user.id,
      user.rol,
      user.sucursal_id,
    );
  }

  @Post('sucursal/:sucursalId/entrada')
  @Roles(...ROLES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar entrada de mercancía al inventario' })
  async entrada(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Body() rawBody: unknown,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const body = EntradaInventarioSchema.parse(rawBody);
    return this.inventario.registrarEntrada(
      sucursalId,
      body.productoId,
      body.cantidad,
      body.observacion,
      user.id,
      user.rol,
      user.sucursal_id,
    );
  }

  @Get('sucursal/:sucursalId/movimientos')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Historial de movimientos de inventario' })
  async listMovimientos(
    @Param('sucursalId', ParseIntPipe) sucursalId: number,
    @Query() rawQuery: unknown,
    @CurrentUser() user: { id: number; rol: string; sucursal_id: number | null },
  ) {
    const query = QueryMovimientosSchema.parse(rawQuery);
    return this.inventario.listMovimientos(sucursalId, query, user.rol, user.sucursal_id);
  }
}
