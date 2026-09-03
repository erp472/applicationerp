import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, Res,
  UseGuards, UseFilters, ParseIntPipe, HttpCode, HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam,
} from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import * as fs from 'node:fs';
import { EnviosMasivosService }      from '../application/envios-masivos.service.js';
import { CrearLoteMasivoSchema }     from '../dto/crear-lote.dto.js';
import { AgregarItemMasivoSchema, ActualizarItemMasivoSchema, AgregarItemsMasivosSchema } from '../dto/agregar-item.dto.js';
import { ImportarCsvSchema }         from '../dto/importar-csv.dto.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';
import { JwtAuthGuard }              from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagGuard }          from '../../common/guards/feature-flag.guard.js';
import { RolesGuard }                from '../../common/guards/roles.guard.js';
import { Roles }                     from '../../common/decorators/roles.decorator.js';
import { Feature }                   from '../../common/decorators/feature.decorator.js';
import { CurrentUser }               from '../../common/decorators/current-user.decorator.js';
import { EnviosMasivosPresenter }       from './envios-masivos.presenter.js';
import { EnviosMasivosDomainFilter }    from './envios-masivos-domain.filter.js';

const ROLES_CAJERO     = ['CAJERO', 'ADMIN_SISTEMA'];
const ROLES_READ       = ['CAJERO', 'SUPERVISOR_REGIONAL', 'ADMIN_SISTEMA', 'ADMIN_NACIONAL'];

@ApiTags('envios-masivos')
@ApiBearerAuth()
@Controller('envios-masivos')
@UseGuards(JwtAuthGuard, FeatureFlagGuard, RolesGuard)
@UseFilters(new EnviosMasivosDomainFilter())
@Feature('modulo:ventas')
export class EnviosMasivosController {
  private readonly logger = new Logger(EnviosMasivosController.name);
  constructor(private readonly service: EnviosMasivosService) {}

  // ── Lotes ─────────────────────────────────────────────────────────────────────

  @AuditKey('OPE-01')
  @Post()
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Crear un nuevo lote de envíos masivos' })
  async crearLote(@CurrentUser() user: any, @Body() body: unknown) {
    const dto = CrearLoteMasivoSchema.parse(body);
    const lote = await this.service.crearLote(user.id, dto);
    return EnviosMasivosPresenter.toLote({ ...lote, items: [] });
  }

  @AuditKey('ADM-04')
  @Get()
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Listar lotes de envíos masivos de una sucursal' })
  @ApiQuery({ name: 'sucursalId', type: Number, required: true })
  @ApiQuery({ name: 'estado', required: false, enum: ['borrador', 'confirmado', 'anulado'] })
  async listarLotes(
    @Query('sucursalId', ParseIntPipe) sucursalId: number,
    @Query('estado') estado?: string,
  ) {
    const lotes = await this.service.listarLotes(sucursalId, estado);
    return lotes.map(EnviosMasivosPresenter.toLoteResumen);
  }

  @AuditKey('ADM-04')
  @Get(':id')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Consultar lote con todos sus items y totales' })
  @ApiParam({ name: 'id', type: Number })
  async getLote(@Param('id', ParseIntPipe) id: number) {
    const lote = await this.service.getLote(id);
    return EnviosMasivosPresenter.toLote(lote);
  }

  @AuditKey('ADM-02')
  @Delete(':id')
  @Roles(...ROLES_CAJERO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar permanentemente un lote (borrador o anulado)' })
  async eliminarLote(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.service.eliminarLote(id);
    } catch (err) {
      this.logger.error(`eliminarLote(${id}) falló: ${err}`);
      throw err;
    }
  }

  // ── Items ─────────────────────────────────────────────────────────────────────

  @AuditKey('OPE-01')
  @Post(':id/items')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Agregar destinatario al lote — cotiza el envío en tiempo real' })
  async agregarItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = AgregarItemMasivoSchema.parse(body);
    const result = await this.service.agregarItem(id, dto);
    return {
      item:      EnviosMasivosPresenter.toItem(result.item),
      cotizacion: result.cotizacion,
    };
  }

  @AuditKey('OPE-01')
  @Post(':id/items/bulk')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Agregar varios destinatarios en una sola petición — las filas inválidas se reportan sin abortar el resto' })
  async agregarItemsBulk(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = AgregarItemsMasivosSchema.parse(body);
    return this.service.agregarItems(id, dto.items);
  }

  @AuditKey('OPE-04')
  @Put(':id/items/:itemId')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Actualizar un item del lote — recalcula en tiempo real' })
  async actualizarItem(
    @Param('id', ParseIntPipe)     id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: unknown,
  ) {
    const dto = ActualizarItemMasivoSchema.parse(body);
    const result = await this.service.actualizarItem(id, itemId, dto);
    return {
      item:      EnviosMasivosPresenter.toItem(result.item),
      cotizacion: result.cotizacion,
    };
  }

  @AuditKey('ADM-02')
  @Delete(':id/items/:itemId')
  @Roles(...ROLES_CAJERO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un item del lote' })
  async eliminarItem(
    @Param('id', ParseIntPipe)     id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    await this.service.eliminarItem(id, itemId);
  }

  // ── CSV Import ────────────────────────────────────────────────────────────────

  @AuditKey('OPE-01')
  @Post(':id/csv')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Importar destinatarios desde CSV — columnas: nombre,documento,email,telefono,direccion,ciudad,pais,codigoPostal,pesoKg,contenido' })
  async importarCsv(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = ImportarCsvSchema.parse(body);
    return this.service.importarCsv(id, dto.csv);
  }

  // ── Confirmar ─────────────────────────────────────────────────────────────────

  @AuditKey('OPE-03')
  @Patch(':id/confirmar')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Confirmar lote: crea los Envios y los envía al carrito de la venta para su cobro' })
  @ApiQuery({ name: 'cajaId', type: Number, required: true })
  @ApiQuery({ name: 'ventaId', type: Number, required: true })
  async confirmarLote(
    @Param('id', ParseIntPipe) id: number,
    @Query('cajaId', ParseIntPipe) cajaId: number,
    @Query('ventaId', ParseIntPipe) ventaId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.confirmarLote(id, cajaId, user.id, ventaId);
  }

  // ── PDF de guías ──────────────────────────────────────────────────────────────

  @AuditKey('ADM-06')
  @Post(':id/guias-pdf')
  @Roles(...ROLES_CAJERO)
  @ApiOperation({ summary: 'Generar (o regenerar) PDF con todas las guías del lote confirmado' })
  @ApiParam({ name: 'id', type: Number })
  async generarGuiasPdf(@Param('id', ParseIntPipe) id: number) {
    const result = await this.service.generarGuiasPdf(id);
    return { totalGuias: result.totalGuias, relPath: result.relPath };
  }

  @AuditKey('ADM-06')
  @Get(':id/guias-pdf')
  @Roles(...ROLES_READ)
  @ApiOperation({ summary: 'Descargar PDF con las guías del lote — se genera en la primera descarga tras el pago' })
  @ApiParam({ name: 'id', type: Number })
  async descargarGuiasPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() reply: FastifyReply,
  ) {
    const relPath = await this.service.getOGenerarPdfPath(id);
    const absPath = this.service.getPdfAbsolutePath(relPath);
    const stream  = fs.createReadStream(absPath);
    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="guias-lote-${id}.pdf"`)
      .send(stream);
  }
}
