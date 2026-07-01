export class UserEntity {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  sucursalId: number | null;
  activo: boolean;
  ultimoLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sucursal?: { id: number; codigo: string; nombre: string; ciudad: string | null } | null;
}
