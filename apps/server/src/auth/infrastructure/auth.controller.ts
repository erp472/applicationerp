import { Controller, Post, Get, Body, Headers, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Devuelve un JWT Bearer token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email:    { type: 'string', format: 'email', example: 'admin@4-72.com.co' },
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
  async login(@Body() body: unknown, @Headers('x-mac-address') mac?: string) {
    const dto = LoginSchema.parse(body);
    return this.authService.login(dto, mac);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del token activo' })
  @ApiResponse({ status: 200, description: 'Datos del usuario autenticado' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  me(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }
}
