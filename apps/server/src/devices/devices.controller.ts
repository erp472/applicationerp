import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Post, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuditKey } from '../audit/decorators/audit-key.decorator.js';

const AuthorizeSchema = z.object({
  mac_address: z.string().regex(/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i),
  sucursal_id: z.coerce.number().int().positive(),
  nombre:      z.string().max(120).optional(),
});

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @AuditKey('ADM-04')
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MAC heartbeat desde equipo POS' })
  heartbeat(@Body() body: { mac: string; hostname?: string }) {
    return { ok: true, mac: body.mac, received_at: new Date().toISOString() };
  }

  @AuditKey('ADM-07')
  @Post('authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Autorizar un equipo (MAC) para una sucursal' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['mac_address', 'sucursal_id'],
      properties: {
        mac_address: { type: 'string', example: 'aa:bb:cc:dd:ee:ff' },
        sucursal_id: { type: 'integer', example: 1 },
        nombre:      { type: 'string', example: 'Caja 1 - Chapinero' },
      },
    },
  })
  async authorize(@Body() body: unknown) {
    const data = AuthorizeSchema.parse(body);
    const macNorm = data.mac_address.toLowerCase();

    const existing = await this.prisma.equipoAutorizado.findFirst({
      where: { mac_addressequipos_autorizados: macNorm, sucursales_idsucursales: data.sucursal_id },
    });

    const equipo = existing
      ? await this.prisma.equipoAutorizado.update({
          where: { idequipos_autorizados: existing.idequipos_autorizados },
          data:  { activoequipos_autorizados: true, nombreequipos_autorizados: data.nombre },
        })
      : await this.prisma.equipoAutorizado.create({
          data: {
            mac_addressequipos_autorizados: macNorm,
            sucursal: { connect: { idsucursales: data.sucursal_id } },
            nombreequipos_autorizados: data.nombre,
          },
        });
    return equipo;
  }

  @AuditKey('ADM-07')
  @Delete('authorize/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revocar autorización de un equipo' })
  async revoke(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.equipoAutorizado.update({
      where: { idequipos_autorizados: id },
      data:  { activoequipos_autorizados: false },
    });
    return { ok: true };
  }

  @AuditKey('ADM-04')
  @Get('authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL', 'SUPERVISOR_REGIONAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar equipos autorizados' })
  async list() {
    return this.prisma.equipoAutorizado.findMany({
      where:   { activoequipos_autorizados: true },
      include: { sucursal: { select: { codigosucursales: true, nombresucursales: true } } },
      orderBy: { created_atequipos_autorizados: 'desc' },
    });
  }
}
