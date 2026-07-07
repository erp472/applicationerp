export class RegionalEntity {
  id:         number;
  comercioId: number;
  codigo:     string;
  nombre:     string;
  activo:     boolean;
  createdAt:  Date;
  comercio?:  { id: number; codigo: string; nombre: string } | null;
}
