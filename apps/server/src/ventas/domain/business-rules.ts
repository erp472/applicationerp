import type { EstadoVenta } from './venta.entity.js';
import {
  SesionCajaInactivaError,
  CarritoVacioError,
  VentaYaAnuladaError,
  VentaDeOtroTurnoError,
  EfectivoInsuficienteError,
} from './venta.errors.js';
import { descomponerIva } from './calculos/descomponer-iva.js';
import { calcularSubtotalLinea } from './calculos/subtotal-linea.js';

// BR-VEN-001: debe existir sesión activa en la caja antes de crear/registrar una venta
export function validarSesionActivaParaVenta(cajaId: number, sesionId: number | null): void {
  if (sesionId === null) throw new SesionCajaInactivaError(cajaId);
}

// BR-VEN-002: el carrito no puede estar vacío al confirmar
export function validarCarritoNoVacio(cantidadItems: number): void {
  if (cantidadItems === 0) throw new CarritoVacioError();
}

// BR-VEN-003: una venta anulada no puede operarse
export function validarVentaActiva(ventaId: number, estado: EstadoVenta): void {
  if (estado === 'anulada') throw new VentaYaAnuladaError(ventaId);
}

// BR-VEN-004: la venta debe pertenecer a la sesión activa de la caja
export function validarVentaEnSesion(ventaId: number, sesionIdVenta: number, sesionIdActiva: number): void {
  if (sesionIdVenta !== sesionIdActiva) throw new VentaDeOtroTurnoError(ventaId);
}

// BR-VEN-005: calcula el total de una línea de detalle
export function calcularSubtotalDetalle(precioUnitario: number, cantidad: number, descuento: number): number {
  return Number(calcularSubtotalLinea(String(precioUnitario), cantidad, String(descuento)));
}

// BR-VEN-007: el dinero recibido en efectivo debe cubrir el total
export function validarEfectivoSuficiente(efectivoRecibido: number, total: number): void {
  if (efectivoRecibido < total) throw new EfectivoInsuficienteError(efectivoRecibido, total);
}

// BR-VEN-006: recalcula totales del carrito.
// Delega la extracción de IVA a descomponerIva() para garantizar la fórmula correcta
// en un único lugar: iva = bruto − bruto/(1 + t/100). NUNCA bruto × tasa directa.
export function calcularTotalesCarrito(items: Array<{ precioUnitario: number; cantidad: number; descuento: number; porcentajeTax: number }>) {
  let subtotal  = 0;
  let descuento = 0;
  let iva       = 0;

  for (const item of items) {
    const { precioSinTax, ivaUnitario } = descomponerIva(item.precioUnitario, item.porcentajeTax);
    subtotal  += precioSinTax  * item.cantidad;
    iva       += ivaUnitario   * item.cantidad;
    descuento += item.descuento;
  }

  return {
    subtotal:  Math.round(subtotal),
    descuento: Math.round(descuento),
    iva:       Math.round(iva),
    total:     Math.round(subtotal + iva - descuento),
  };
}
