export enum RolUsuario {
  CAJERO = 'CAJERO',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  TESORERIA = 'TESORERIA',
  INVENTARIOS = 'INVENTARIOS',
  SUPERVISOR_REGIONAL = 'SUPERVISOR_REGIONAL',
  ADMIN_NACIONAL = 'ADMIN_NACIONAL',
  ADMIN_SISTEMA = 'ADMIN_SISTEMA',
}

export class UsuarioEntity {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  sucursalId: string | null;
  activo: boolean;
  ultimoLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sucursal?: { id: string; codigo: string; nombre: string; ciudad: string | null } | null;
}
