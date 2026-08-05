import {
  Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
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

  @Post()
  async crear(@Body() body: CrearSacaBody, @CurrentUser() user: { id: number }) {
    return this.sacasService.crear({ ...body, usuarioId: user.id });
  }

  @Post(':id/envios')
  async agregarEnvio(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AgregarEnvioBody,
  ) {
    return this.sacasService.agregarEnvio(id, body.envioId);
  }

  @Patch(':id/cerrar')
  async cerrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CerrarSacaBody,
  ) {
    return this.sacasService.cerrar(id, body);
  }

  @Get()
  async listar(
    @Query('sucursalId', ParseIntPipe) sucursalId: number,
    @Query('estado') estado?: string,
  ) {
    return this.sacasService.listar(sucursalId, estado);
  }

  @Get(':id')
  async obtener(@Param('id', ParseIntPipe) id: number) {
    return this.sacasService.obtener(id);
  }
}
