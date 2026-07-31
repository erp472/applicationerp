import type { EstadoStock } from './inventario.entity.js';
import { StockInsuficienteInventarioError } from './inventario.errors.js';

export function calcularEstadoStock(actual: number, minimo: number): EstadoStock {
  if (actual >= minimo) return 'ok';
  if (actual > 0) return 'bajo';
  return 'critico';
}

export function validarStockSuficiente(
  productoNombre: string,
  stockActual: number,
  cantidadSolicitada: number,
): void {
  if (cantidadSolicitada <= 0) throw new Error('La cantidad solicitada debe ser mayor a cero');
  if (stockActual < cantidadSolicitada) {
    throw new StockInsuficienteInventarioError(productoNombre, stockActual, cantidadSolicitada);
  }
}

export function evaluarAlertaReorden(stockPost: number, stockMinimo: number): boolean {
  return stockPost <= stockMinimo;
}
