export class ProductoDomainError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ProductoNotFoundError extends ProductoDomainError {
  constructor(id: number) {
    super(`Producto con id '${id}' no encontrado`, 404);
  }
}

export class ProductoCodigoDuplicadoError extends ProductoDomainError {
  constructor(codigo: string) {
    super(`Código de producto '${codigo}' ya está registrado`, 409);
  }
}

export class ProductoPrecioInvalidoError extends ProductoDomainError {
  constructor() {
    super('El precio del producto debe ser mayor a cero', 400);
  }
}

export class ProductoPesoInvalidoError extends ProductoDomainError {
  constructor() {
    super('El peso del producto debe ser mayor a cero', 400);
  }
}

export class ProductoFactorVolumetricoInvalidoError extends ProductoDomainError {
  constructor() {
    super('El factor volumétrico debe ser mayor a cero', 400);
  }
}

export class ProductoTipoInvalidoError extends ProductoDomainError {
  constructor(tipo: string) {
    super(`Tipo de producto '${tipo}' no es válido`, 400);
  }
}

export class ProductoSucursalNoEncontradaError extends ProductoDomainError {
  constructor(sucursalId: number) {
    super(`Sucursal con id '${sucursalId}' no encontrada`, 400);
  }
}

export class ProductoYaAsignadoError extends ProductoDomainError {
  constructor(productoId: number, sucursalId: number) {
    super(`Producto '${productoId}' ya está asignado a la sucursal '${sucursalId}'`, 409);
  }
}

export class ProductoNoAsignadoError extends ProductoDomainError {
  constructor(productoId: number, sucursalId: number) {
    super(`Producto '${productoId}' no está asignado a la sucursal '${sucursalId}'`, 404);
  }
}
