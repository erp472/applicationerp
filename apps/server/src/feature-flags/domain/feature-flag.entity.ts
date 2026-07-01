export enum FeatureFlagModo {
  PRODUCCION = 'PRODUCCION',
  AB_TEST    = 'AB_TEST',
  INACTIVO   = 'INACTIVO',
}

export class FeatureFlagEntity {
  id:          string;
  nombre:      string;
  modo:        FeatureFlagModo;
  descripcion: string | null;
  createdAt:   Date;
  updatedAt:   Date;
}
