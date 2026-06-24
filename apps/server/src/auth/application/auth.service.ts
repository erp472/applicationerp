import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { JwtPayload, LoginResult } from '../domain/auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, macAddress?: string): Promise<LoginResult> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        rol: true,
        sucursalId: true,
        nombre: true,
        activo: true,
      },
    });

    if (!usuario || !usuario.activo) throw new UnauthorizedException('Credenciales inválidas');

    const passwordOk = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordOk) {
      void this.audit.log({ accion: 'LOGIN', entidad: 'auth', entidad_id: dto.email, resultado: 'ERROR', error_msg: 'Credenciales inválidas' });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.validateMac(macAddress, usuario.id);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    void this.audit.log({ accion: 'LOGIN', entidad: 'auth', usuario_id: usuario.id, entidad_id: usuario.email, resultado: 'OK' });

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      rol: Buffer.from(usuario.rol).toString('base64'),
      sucursal_id: usuario.sucursalId,
      nombre: usuario.nombre,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        sucursal_id: usuario.sucursalId,
      },
    };
  }

  async getProfile(userId: string) {
    return this.prisma.usuario.findUnique({
      where: { id: userId, activo: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        sucursalId: true,
        ultimoLogin: true,
        sucursal: { select: { nombre: true, codigo: true } },
      },
    });
  }

  private async validateMac(mac: string | undefined, usuarioId: string) {
    if (!mac) throw new UnauthorizedException('Este equipo no está autorizado. Contáctese con soporte: applicationerp472@gmail.com');

    const equipo = await this.prisma.equipoAutorizado.findFirst({
      where: { macAddress: mac.toLowerCase(), usuarioId, activo: true },
    });

    if (!equipo) throw new UnauthorizedException('Este equipo no está autorizado para este usuario. Contáctese con soporte: applicationerp472@gmail.com');
  }
}
