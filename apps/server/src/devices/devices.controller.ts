import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

const AuthorizeSchema = z.object({
  mac_address: z.string().regex(/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i),
  usuario_id:  z.string().uuid().optional(),
  sucursal_id: z.string().uuid(),
  nombre:      z.string().max(120).optional(),
});

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MAC heartbeat desde equipo POS' })
  heartbeat(@Body() body: { mac: string; hostname?: string }) {
    return { ok: true, mac: body.mac, received_at: new Date().toISOString() };
  }

  @Post('authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Autorizar un equipo (MAC) para un usuario o sucursal' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['mac_address', 'sucursal_id'],
      properties: {
        mac_address: { type: 'string', example: 'aa:bb:cc:dd:ee:ff' },
        usuario_id:  { type: 'string', format: 'uuid', nullable: true, description: 'Si se omite, el equipo queda autorizado para toda la sucursal' },
        sucursal_id: { type: 'string', format: 'uuid' },
        nombre:      { type: 'string', example: 'Caja 1 - Chapinero' },
      },
    },
  })
  async authorize(@Body() body: unknown) {
    const data = AuthorizeSchema.parse(body);
    const macNorm    = data.mac_address.toLowerCase();
    const usuarioId  = data.usuario_id ?? null;
    const sucursalId = data.sucursal_id;

    // upsert requires the unique composite key — null fields need manual find+create
    const existing = await this.prisma.equipoAutorizado.findFirst({
      where: { macAddress: macNorm, sucursalId, usuarioId },
    });

    const equipo = existing
      ? await this.prisma.equipoAutorizado.update({
          where: { id: existing.id },
          data:  { activo: true, nombre: data.nombre },
        })
      : await this.prisma.equipoAutorizado.create({
          data: { macAddress: macNorm, sucursalId, usuarioId, nombre: data.nombre },
        });
    return equipo;
  }

  @Delete('authorize/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revocar autorización de un equipo' })
  async revoke(@Param('id', ParseUUIDPipe) id: string) {
    await this.prisma.equipoAutorizado.update({
      where: { id },
      data: { activo: false },
    });
    return { ok: true };
  }

  @Get('authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_SISTEMA', 'ADMIN_NACIONAL', 'SUPERVISOR_REGIONAL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar equipos autorizados' })
  async list() {
    return this.prisma.equipoAutorizado.findMany({
      where: { activo: true },
      include: {
        sucursal: { select: { codigo: true, nombre: true } },
        usuario:  { select: { nombre: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
