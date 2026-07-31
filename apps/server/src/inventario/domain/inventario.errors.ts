export class InventarioDomainError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'InventarioDomainError';
  }
}

export class StockInsuficienteInventarioError extends InventarioDomainError {
  readonly code = 'STOCK_INSUFICIENTE';
  readonly stockActual: number;
  readonly cantidadRequerida: number;
  constructor(productoNombre: string, stockActual: number, cantidadRequerida: number) {
    super(`Stock insuficiente para "${productoNombre}": disponible ${stockActual}, solicitado ${cantidadRequerida}`);
    this.name = 'StockInsuficienteInventarioError';
    this.stockActual = stockActual;
    this.cantidadRequerida = cantidadRequerida;
  }
}

export class ProductoNoEnInventarioError extends InventarioDomainError {
  constructor(productoId: number, sucursalId: number) {
    super(`Producto ${productoId} no encontrado en inventario de sucursal ${sucursalId}`);
    this.name = 'ProductoNoEnInventarioError';
  }
}
