export interface PagoAdministrativoResult {
  monto: string;
  descripcion: string;
  tipoMovimiento: 'pago_administrativo';
  esEntrada: false;
  saldoDespues: string;
}

// Salida de efectivo por concepto administrativo con descripción obligatoria
export function buildPagoAdministrativo(
  monto: string,
  descripcion: string,
  saldoActual: string,
): PagoAdministrativoResult {
  const m = Number(monto);
  const s = Number(saldoActual);
  if (m <= 0) throw new Error('El monto debe ser mayor a cero');
  if (!descripcion || !descripcion.trim()) {
    throw new Error('La descripción del pago administrativo es obligatoria');
  }
  if (m > s) throw new Error(`Monto ${monto} supera el saldo disponible ${saldoActual}`);
  return {
    monto,
    descripcion: descripcion.trim(),
    tipoMovimiento: 'pago_administrativo',
    esEntrada: false,
    saldoDespues: (s - m).toFixed(2),
  };
}
