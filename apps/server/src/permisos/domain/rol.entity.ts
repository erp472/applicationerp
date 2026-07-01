export class RolEntity {
  id: string;
  nombre: string;
  createdAt: Date;
  updatedAt: Date;
  permisos?: PermisoEnRol[];
}

export class PermisoEnRol {
  id: string;
  nombre: string;
}
