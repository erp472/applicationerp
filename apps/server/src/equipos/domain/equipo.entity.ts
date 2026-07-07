export class EquipoEntity {
  id:               number;
  sucursalId:       number;
  mac:              string;
  nombre:           string | null;
  sistemaOperativo: string | null;
  activo:           boolean;
  createdAt:        Date;
  sucursal?:        { id: number; codigo: string; nombre: string } | null;
}
