export class UserEntity {
  id:          number;
  nombre:      string;
  email:       string;
  rol:         string;
  sucursalId:  number | null;
  telefono:        string | null;
  tipoDocumento:   string | null;
  numeroDocumento: string | null;
  paisId:          number | null;
  departamentoId: number | null;
  ciudadId:    number | null;
  activo:      boolean;
  ultimoLogin: Date | null;
  createdAt:   Date;
  updatedAt:   Date;
  sucursal?: {
    id:     number;
    codigo: string;
    nombre: string;
    ciudad: string | null;
  } | null;
  pais?:         { id: number; nombre: string } | null;
  departamento?: { id: number; nombre: string } | null;
  ciudad?:       { id: number; nombre: string } | null;
}
