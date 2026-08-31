import { afectaEfectivo } from '../business-rules.js';
import type { MedioPago } from './saldo-por-medio-pago.js';

export interface ParteMovimiento {
  monto: string;
  medioPago?: MedioPago;
}

// Un pago mixto (estampillas o preporteado + vuelto en efectivo) llega como un solo
// monto con el medio declarado. Se parte en dos movimientos para que la porción en
// efectivo entre al cajón y la porción no-efectivo conserve su medio para reportes.
// Las partes siempre suman el monto original: nunca se duplica facturación.
export function repartirPagoPorMedio(
  monto: string,
  medioPago: MedioPago | undefined,
  montoEfectivo: string | number | undefined,
): ParteMovimiento[] {
  const total = Number(monto);
  if (afectaEfectivo(medioPago)) return [{ monto, medioPago }];

  const efectivo = Math.min(Math.max(Number(montoEfectivo ?? 0), 0), total);
  if (efectivo <= 0)    return [{ monto, medioPago }];
  if (efectivo >= total) return [{ monto, medioPago: 'efectivo' }];

  return [
    { monto: (total - efectivo).toFixed(2), medioPago },
    { monto: efectivo.toFixed(2),           medioPago: 'efectivo' },
  ];
}
