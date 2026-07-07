export type TipoProducto = 'estampilla' | 'filatelia' | 'empaque' | 'material_oficina' | 'otro';

export interface ProductoEntity {
  id:               number;
  codigo:           string;
  nombre:           string;
  descripcion:      string | null;
  tipo:             TipoProducto;
  precio:           number;
  precioSinTax:     number | null;
  porcentajeTax:    number;
  peso:             number | null;
  factorVolumetrico: number | null;
  imagenUrl:        string | null;
  activo:           boolean;
  createdAt:        Date;
  updatedAt:        Date;
}

export interface ProductoSucursalEntity {
  sucursalId: number;
  productoId: number;
  activo:     boolean;
  sucursal:   { id: number; codigo: string; nombre: string } | null;
}
