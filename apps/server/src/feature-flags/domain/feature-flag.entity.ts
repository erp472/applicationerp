export interface FeatureFlagRolRef {
  id: number;
  codigo: string;
  nombre: string;
}

export interface FeatureFlagUsuarioRef {
  id: number;
  nombre: string;
  email: string;
}

export class FeatureFlagEntity {
  id: number;
  codigo: string;
  descripcion: string | null;
  activo: boolean;
  entorno: string;
  plataforma: string;
  createdAt: Date;
  updatedAt: Date;
  roles: FeatureFlagRolRef[];
  usuarios: FeatureFlagUsuarioRef[];
}
