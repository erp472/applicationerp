import { calcularArqueo, type Denominacion } from './arqueo-denominaciones.js';

export interface CierreSesionResult {
  saldoEsperado: string;
  totalArqueo: string;
  diferencia: string;
  tieneDiferencia: boolean;
  tipoMovimiento: 'cierre';
  denominaciones: Denominacion[];
}

export interface DiferenciaCierreResult {
  diferencia: string;
  diferenciaNeta: string;
  tipo: 'sobrante' | 'faltante' | 'cuadre';
  estado: 'pendiente' | 'cuadre';
}

// Cierre de sesión principal o de caja auxiliar con arqueo server-side
export function calcularCierreSesion(
  saldoEsperado: string,
  denominaciones: Denominacion[],
): CierreSesionResult {
  const { total } = calcularArqueo(denominaciones);
  const diff = Number(total) - Number(saldoEsperado);
  return {
    saldoEsperado,
    totalArqueo: total,
    diferencia: diff.toFixed(2),
    tieneDiferencia: diff !== 0,
    tipoMovimiento: 'cierre',
    denominaciones,
  };
}

// Clasifica la diferencia entre arqueo y saldo esperado
export function calcularDiferenciaCierre(
  saldoEsperado: string,
  totalArqueo: string,
): DiferenciaCierreResult {
  const diff = Number(totalArqueo) - Number(saldoEsperado);
  return {
    diferencia: Math.abs(diff).toFixed(2),
    diferenciaNeta: diff.toFixed(2),
    tipo: diff > 0 ? 'sobrante' : diff < 0 ? 'faltante' : 'cuadre',
    estado: diff !== 0 ? 'pendiente' : 'cuadre',
  };
}
