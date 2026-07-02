import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from '@node-rs/bcrypt';
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
      where: { emailusuarios: dto.email },
      select: {
        idusuarios:             true,
        emailusuarios:          true,
        password_hashusuarios:  true,
        sucursales_idsucursales: true,
        nombreusuarios:         true,
        activousuarios:         true,
        rol:                    { select: { codigoroles: true } },
      },
    });

    if (!usuario || !usuario.activousuarios) throw new UnauthorizedException('Credenciales inválidas');

    const passwordOk = await compare(dto.password, usuario.password_hashusuarios);
    if (!passwordOk) {
      void this.audit.log({ accion: 'LOGIN', entidad: 'auth', entidad_id: dto.email, resultado: 'ERROR', error_msg: 'Credenciales inválidas' });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.validateMac(macAddress, usuario.idusuarios, usuario.sucursales_idsucursales, usuario.rol.codigoroles);

    await this.prisma.usuario.update({
      where: { idusuarios: usuario.idusuarios },
      data:  { ultimo_loginusuarios: new Date() },
    });

    void this.audit.log({ accion: 'LOGIN', entidad: 'auth', usuario_id: usuario.idusuarios, entidad_id: usuario.idusuarios, resultado: 'OK' });

    const payload: JwtPayload = {
      sub:         usuario.idusuarios,
      email:       usuario.emailusuarios,
      rol:         Buffer.from(usuario.rol.codigoroles).toString('base64'),
      sucursal_id: usuario.sucursales_idsucursales ?? null,
      nombre:      usuario.nombreusuarios,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id:          usuario.idusuarios,
        nombre:      usuario.nombreusuarios,
        rol:         usuario.rol.codigoroles,
        sucursal_id: usuario.sucursales_idsucursales ?? null,
      },
    };
  }

  async getProfile(userId: number) {
    const u = await this.prisma.usuario.findUnique({
      where:  { idusuarios: userId, activousuarios: true },
      select: {
        idusuarios:              true,
        nombreusuarios:          true,
        emailusuarios:           true,
        sucursales_idsucursales: true,
        activousuarios:          true,
        ultimo_loginusuarios:    true,
        rol:                     { select: { codigoroles: true } },
      },
    });
    if (!u) return null;
    return {
      id:          String(u.idusuarios),
      nombre:      u.nombreusuarios,
      email:       u.emailusuarios,
      rol:         u.rol.codigoroles,
      sucursal_id: u.sucursales_idsucursales != null ? String(u.sucursales_idsucursales) : null,
      activo:      u.activousuarios,
      ultimoLogin: u.ultimo_loginusuarios?.toISOString() ?? null,
    };
  }

  private async validateMac(
    mac: string | undefined,
    usuarioId: number,
    sucursalId: number | null,
    rol: string,
  ) {
    if (process.env.NODE_ENV === 'development') return;
    if (rol === 'ADMIN_SISTEMA' || rol === 'ADMIN_NACIONAL') return;

    if (!mac) throw new UnauthorizedException('Este equipo no está autorizado. Contáctese con soporte: applicationerp472@gmail.com');

    const where = sucursalId != null
      ? { mac_addressequipos_autorizados: mac.toLowerCase(), sucursales_idsucursales: sucursalId, activoequipos_autorizados: true }
      : { mac_addressequipos_autorizados: mac.toLowerCase(), activoequipos_autorizados: true };

    const equipo = await this.prisma.equipoAutorizado.findFirst({ where });

    if (!equipo) throw new UnauthorizedException('Este equipo no está autorizado para este usuario. Contáctese con soporte: applicationerp472@gmail.com');
  }
}
