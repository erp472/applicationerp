import { calcularFechaVencimiento } from './fecha-vencimiento.js';
import { calcularPrecioPorMeses } from './precio-por-meses.js';
import { calcularIvaApartado, type IvaApartadoResult } from './iva-apartado.js';

export interface RenovacionApartadoResult extends IvaApartadoResult {
  nuevaFechaFin: string;
  mesesRenovacion: number;
}

// Calcula nueva fecha fin y precio para renovación de apartado postal
export function calcularRenovacionApartado(
  fechaFinActual: string,
  mesesRenovacion: number,
  tarifaAnual: string,
  porcentajeTax: string,
  incluyeIva: boolean = true,
): RenovacionApartadoResult {
  const nuevaFechaFin = calcularFechaVencimiento(fechaFinActual, mesesRenovacion);
  const precioSinTax = calcularPrecioPorMeses(tarifaAnual, mesesRenovacion);
  const desglose = calcularIvaApartado(precioSinTax, porcentajeTax, incluyeIva);
  return { ...desglose, nuevaFechaFin, mesesRenovacion };
}
