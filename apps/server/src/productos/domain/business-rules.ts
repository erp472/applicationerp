import {
  ProductoCodigoDuplicadoError,
  ProductoPrecioInvalidoError,
  ProductoPesoInvalidoError,
  ProductoFactorVolumetricoInvalidoError,
  ProductoTipoInvalidoError,
} from './producto.errors.js';

// BR-PRD-001
export function validateCodigoNotDuplicated(codigo: string, exists: boolean): void {
  if (exists) throw new ProductoCodigoDuplicadoError(codigo);
}

// BR-PRD-002
export function validatePrecio(precio: number): void {
  if (precio <= 0) throw new ProductoPrecioInvalidoError();
}

// BR-PRD-003: precio / (1 + porcentajeTax / 100), redondeado a 2 decimales
export function calcularPrecioSinTax(precio: number, porcentajeTax: number): number {
  if (porcentajeTax === 0) return precio;
  return Math.round((precio / (1 + porcentajeTax / 100)) * 100) / 100;
}

// BR-PRD-004
export function validatePeso(peso: number | null): void {
  if (peso !== null && peso <= 0) throw new ProductoPesoInvalidoError();
}

export function validateFactorVolumetrico(factor: number | null): void {
  if (factor !== null && factor <= 0) throw new ProductoFactorVolumetricoInvalidoError();
}

// BR-PRD-005 (#POC-INV-003)
export function isStockCritico(cantidadActual: number, cantidadMinima: number): boolean {
  return cantidadActual <= cantidadMinima;
}

// BR-PRD-006
export function validateTipoProducto(tipo: string, validValues: string[]): void {
  if (!validValues.includes(tipo)) throw new ProductoTipoInvalidoError(tipo);
}
