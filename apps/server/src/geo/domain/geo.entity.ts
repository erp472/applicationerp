export interface PaisEntity {
  id:     number;
  nombre: string;
  iso2:   string | null;
}

export interface DepartamentoEntity {
  id:      number;
  paisId:  number;
  nombre:  string;
}

export interface CiudadEntity {
  id:             number;
  departamentoId: number;
  nombre:         string;
}
