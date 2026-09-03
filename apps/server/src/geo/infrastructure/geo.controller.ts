import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GeoService } from '../application/geo.service.js';
import { GeoPresenter } from './geo.presenter.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AuditKey } from '../../audit/decorators/audit-key.decorator.js';

@ApiTags('geo')
@ApiBearerAuth()
@Controller('geo')
@UseGuards(JwtAuthGuard)
export class GeoController {
  constructor(private readonly service: GeoService) {}

  @AuditKey('ADM-04')
  @Get('paises')
  @ApiOperation({ summary: 'Lista todos los países' })
  @ApiResponse({ status: 200, description: '214 países ordenados alfabéticamente' })
  async getPaises() {
    return GeoPresenter.paisesList(await this.service.findAllPaises());
  }

  @AuditKey('ADM-04')
  @Get('paises/:id/departamentos')
  @ApiOperation({ summary: 'Departamentos de un país' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del país (ej: 82 = Colombia)' })
  @ApiResponse({ status: 200, description: 'Departamentos del país' })
  async getDepartamentos(@Param('id', ParseIntPipe) id: number) {
    return GeoPresenter.departamentosList(await this.service.findDepartamentosByPais(id));
  }

  @AuditKey('ADM-04')
  @Get('departamentos/:id/ciudades')
  @ApiOperation({ summary: 'Ciudades de un departamento (solo Colombia tiene datos)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del departamento' })
  @ApiResponse({ status: 200, description: 'Ciudades del departamento' })
  async getCiudades(@Param('id', ParseIntPipe) id: number) {
    return GeoPresenter.ciudadesList(await this.service.findCiudadesByDepartamento(id));
  }
}
