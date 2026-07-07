export class SucursalEntity {
  id:             number;
  regionalId:     number;
  paisId:         number | null;
  departamentoId: number | null;
  ciudadId:       number | null;
  codigo:         string;
  nombre:         string;
  direccion:      string | null;
  tipo:           string;
  telefono:       string | null;
  email:          string | null;
  horarioApertura: Date | null;
  horarioCierre:  Date | null;
  activo:         boolean;
  createdAt:      Date;
  updatedAt:      Date;
  regional?:      {
    id: number; codigo: string; nombre: string;
    comercio: { id: number; codigo: string; nombre: string };
  } | null;
  pais?:         { id: number; nombre: string } | null;
  departamento?: { id: number; nombre: string } | null;
  ciudad?:       { id: number; nombre: string } | null;
}
