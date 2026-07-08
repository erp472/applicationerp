import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from '@node-rs/bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { PermisosService } from '../../permisos/permisos.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { JwtPayload, LoginResult } from '../domain/auth.types.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
    private readonly permisosService: PermisosService,
  ) {}

  async login(dto: LoginDto, macAddress?: string, plataforma?: string): Promise<LoginResult> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { emailusuarios: dto.email },
      select: {
        idusuarios:             true,
        emailusuarios:          true,
        password_hashusuarios:  true,
        sucursales_idsucursales: true,
        nombreusuarios:         true,
        activousuarios:         true,
        rol:                    { select: { idroles: true, codigoroles: true } },
      },
    });

    if (!usuario || !usuario.activousuarios) throw new UnauthorizedException('Credenciales inválidas');

    const passwordOk = await compare(dto.password, usuario.password_hashusuarios);
    if (!passwordOk) {
      void this.audit.log({ accion: 'LOGIN', entidad: 'auth', entidad_id: dto.email, resultado: 'ERROR', error_msg: 'Credenciales inválidas' });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.validateMac(macAddress, plataforma, usuario.idusuarios, usuario.sucursales_idsucursales, usuario.rol.codigoroles);

    await this.prisma.usuario.update({
      where: { idusuarios: usuario.idusuarios },
      data:  { ultimo_loginusuarios: new Date() },
    });

    void this.audit.log({ accion: 'LOGIN', entidad: 'auth', usuario_id: usuario.idusuarios, entidad_id: usuario.idusuarios, resultado: 'OK' });

    const permisos = await this.obtenerPermisos(usuario.rol.idroles);

    const payload: JwtPayload = {
      sub:         usuario.idusuarios,
      email:       usuario.emailusuarios,
      rol:         Buffer.from(usuario.rol.codigoroles).toString('base64'),
      sucursal_id: usuario.sucursales_idsucursales ?? null,
      nombre:      usuario.nombreusuarios,
      permisos,
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
      sucursal_id: u.sucursales_idsucursales ?? null,
      activo:      u.activousuarios,
      ultimoLogin: u.ultimo_loginusuarios?.toISOString() ?? null,
    };
  }

  private async validateMac(
    mac: string | undefined,
    plataforma: string | undefined,
    usuarioId: number,
    sucursalId: number | null,
    rol: string,
  ) {
    if (rol === 'ADMIN_SISTEMA' || rol === 'ADMIN_NACIONAL') return;

    // CAJERO: siempre debe venir de Tauri con MAC aprobada, sin bypass de entorno
    if (rol === 'CAJERO') {
      this.logger.log(`[CAJERO login] plataforma=${plataforma} mac=${mac}`);
      if (plataforma !== 'tauri') {
        throw new UnauthorizedException('El acceso de cajero solo está permitido desde la aplicación de escritorio.');
      }
      if (!mac) throw new UnauthorizedException('Este equipo no está autorizado. Contáctese con soporte: applicationerp472@gmail.com');

      const equipo = await this.prisma.equipoAutorizado.findFirst({
        where: {
          mac_addressequipos_autorizados: mac.toLowerCase(),
          ...(sucursalId != null ? { sucursales_idsucursales: sucursalId } : {}),
          activoequipos_autorizados: true,
        },
      });
      if (!equipo) throw new UnauthorizedException('Este equipo no está autorizado para este cajero. Contáctese con soporte: applicationerp472@gmail.com');
      return;
    }

    if (process.env.NODE_ENV === 'development') return;

    if (!mac) throw new UnauthorizedException('Este equipo no está autorizado. Contáctese con soporte: applicationerp472@gmail.com');

    const where = sucursalId != null
      ? { mac_addressequipos_autorizados: mac.toLowerCase(), sucursales_idsucursales: sucursalId, activoequipos_autorizados: true }
      : { mac_addressequipos_autorizados: mac.toLowerCase(), activoequipos_autorizados: true };

    const equipo = await this.prisma.equipoAutorizado.findFirst({ where });

    if (!equipo) throw new UnauthorizedException('Este equipo no está autorizado para este usuario. Contáctese con soporte: applicationerp472@gmail.com');
  }

  private async obtenerPermisos(rolId: number): Promise<string[]> {
    const asignaciones = await this.permisosService.getPermisosDeRol(rolId);
    return asignaciones.map((a) => a.permiso.codigopermisos);
  }
}
