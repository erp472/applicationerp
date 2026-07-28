export interface BaseAperturaResult {
  montoApertura: string;
  tipoMovimiento: 'apertura';
  saldoInicial: string;
}

export interface BaseAsignadaResult {
  baseAsignada: string;
  saldoPrincipalRestante: string;
}

// Validación y payload de apertura de caja principal
export function buildBaseAperturaPrincipal(montoApertura: string): BaseAperturaResult {
  if (Number(montoApertura) <= 0) throw new Error('El monto de apertura debe ser mayor a cero');
  return { montoApertura, tipoMovimiento: 'apertura', saldoInicial: montoApertura };
}

// Validación y payload de asignación de base a caja auxiliar
export function calcularBaseAsignadaAuxiliar(
  saldoPrincipal: string,
  baseAsignada: string,
  auxiliarTieneSesionAbierta: boolean,
): BaseAsignadaResult {
  const saldo = Number(saldoPrincipal);
  const base = Number(baseAsignada);
  if (auxiliarTieneSesionAbierta) throw new Error('La caja auxiliar ya tiene una sesión abierta');
  if (base <= 0) throw new Error('La base asignada debe ser mayor a cero');
  if (saldo < base) {
    throw new Error(`Saldo principal ${saldoPrincipal} insuficiente para base ${baseAsignada}`);
  }
  return { baseAsignada, saldoPrincipalRestante: (saldo - base).toFixed(2) };
}
