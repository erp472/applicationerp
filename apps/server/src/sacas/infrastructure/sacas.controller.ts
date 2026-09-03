import {
  Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { SacasService } from '../application/sacas.service.js';
import type { TipoSaca, TipoConsolidacionSaca } from '../domain/saca.entity.js';

class CrearSacaBody {
  numeroPrecinto!:      string;
  tipo!:                TipoSaca;
  sucursalId!:          number;
  sesionCajaId?:        number;
  tipoConsolidacion?:   TipoConsolidacionSaca;
  centroOperativoDest?: string;
  transportistaNombre?: string;
}

class AgregarEnvioBody {
  envioId!: number;
}

class CerrarSacaBody {
  pesoKg?:              number;
  transportistaNombre?: string;
  fechaDespacho?:       string;
}

@Controller('sacas')
@UseGuards(JwtAuthGuard)
export class SacasController {
  constructor(private readonly sacasService: SacasService) {}

  @AuditKey('OPE-01')
  @Post()
  async crear(@Body() body: CrearSacaBody, @CurrentUser() user: { id: number }) {
    return this.sacasService.crear({ ...body, usuarioId: user.id });
  }

  @AuditKey('OPE-03')
  @Post(':id/envios')
  async agregarEnvio(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AgregarEnvioBody,
  ) {
    return this.sacasService.agregarEnvio(id, body.envioId);
  }

  @AuditKey('OPE-04')
  @Patch(':id/cerrar')
  async cerrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CerrarSacaBody,
  ) {
    return this.sacasService.cerrar(id, body);
  }

  @AuditKey('ADM-04')
  @Get()
  async listar(
    @Query('sucursalId', ParseIntPipe) sucursalId: number,
    @Query('estado') estado?: string,
  ) {
    return this.sacasService.listar(sucursalId, estado);
  }

  @AuditKey('ADM-04')
  @Get(':id')
  async obtener(@Param('id', ParseIntPipe) id: number) {
    return this.sacasService.obtener(id);
  }
}
