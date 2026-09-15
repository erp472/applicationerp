import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { SigmaService } from './sigma.service.js';
import { AuditKey } from '../audit/decorators/audit-key.decorator.js';

@Controller('sigma')
@UseGuards(JwtAuthGuard)
export class SigmaController {
  constructor(private readonly sigmaService: SigmaService) {}

  @AuditKey('OPE-07')
  @Get('codigo-postal')
  async getCodigoPostal(@Query('ciudad') ciudad: string) {
    const codigoPostal = await this.sigmaService.getCodigoPostal(ciudad ?? '');
    return { codigoPostal };
  }
}
