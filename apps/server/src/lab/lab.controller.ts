import {
  Controller, Post, Get, Body, Headers,
  HttpCode, HttpStatus, UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiHeader } from '@nestjs/swagger';
import { LabService } from './lab.service.js';

@ApiTags('lab')
@Controller('lab')
export class LabController {
  constructor(private readonly lab: LabService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticación Lab — usa MongoDB, independiente del JWT principal' })
  @ApiBody({ schema: { properties: { usuario: { type: 'string' }, contraseña: { type: 'string' } } } })
  login(@Body() body: { usuario: string; contraseña: string }) {
    if (!body?.usuario || !body?.contraseña) {
      throw new UnauthorizedException('usuario y contraseña requeridos');
    }
    return this.lab.login(body.usuario, body.contraseña);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verificar sesión Lab activa' })
  @ApiHeader({ name: 'authorization', description: 'Bearer <lab-token>' })
  verify(@Headers('authorization') auth: string) {
    const token = auth?.replace(/^Bearer\s+/i, '').trim();
    return this.lab.verify(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesión Lab' })
  async logout(@Headers('authorization') auth: string) {
    const token = auth?.replace(/^Bearer\s+/i, '').trim();
    await this.lab.logout(token);
  }
}
