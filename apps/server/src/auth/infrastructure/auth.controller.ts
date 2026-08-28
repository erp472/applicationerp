import { Controller, Post, Get, Body, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ZodError } from 'zod';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from '../application/auth.service.js';
import { LoginSchema } from '../dto/login.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Devuelve un JWT Bearer token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email:    { type: 'string', format: 'email', example: 'adminemail.com' },
        password: { type: 'string', minLength: 6, example: 'Segura123!' },
      },
    },
  })
  @ApiHeader({ name: 'x-mac-address', required: false, description: 'MAC del equipo (validación de sucursal)' })
  @ApiResponse({
    status: 201,
    description: 'Login exitoso',
    schema: {
      properties: {
        access_token: { type: 'string', example: 'eyJhbGci...' },
        usuario: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            nombre:      { type: 'string' },
            rol:         { type: 'string' },
            sucursal_id: { type: 'string', format: 'uuid', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(
    @Body() body: unknown,
    @Headers('x-mac-address') mac?: string,
    @Headers('x-plataforma') plataforma?: string,
  ) {
    try {
      const dto = LoginSchema.parse(body);
      return this.authService.login(dto, mac, plataforma);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.flatten());
      }
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del token activo' })
  @ApiResponse({ status: 200, description: 'Datos del usuario autenticado' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  me(@CurrentUser() user: { id: number }) {
    return this.authService.getProfile(user.id);
  }
}
