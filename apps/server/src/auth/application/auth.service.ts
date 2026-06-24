import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { JwtPayload, LoginResult } from '../domain/auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
    if (!passwordOk) throw new UnauthorizedException('Credenciales inválidas');

    await this.validateMac(macAddress, usuario.id, usuario.sucursalId);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
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

  private async validateMac(mac: string | undefined, usuarioId: string, sucursalId: string | null) {
    if (!mac) throw new UnauthorizedException('Este equipo no está autorizado. Contáctese con soporte: applicationerp472@gmail.com');

    const macNorm = mac.toLowerCase();

    // Busca primero un equipo vinculado específicamente a este usuario
    const equipoUsuario = await this.prisma.equipoAutorizado.findFirst({
      where: { macAddress: macNorm, usuarioId, activo: true },
    });
    if (equipoUsuario) return;

    // Si el usuario tiene sucursal, acepta también equipos autorizados a nivel de sucursal
    if (sucursalId) {
      const equipoSucursal = await this.prisma.equipoAutorizado.findFirst({
        where: { macAddress: macNorm, sucursalId, usuarioId: null, activo: true },
      });
      if (equipoSucursal) return;
    }

    throw new UnauthorizedException('Este equipo no está autorizado para este usuario. Contáctese con soporte: applicationerp472@gmail.com');
  }
}
