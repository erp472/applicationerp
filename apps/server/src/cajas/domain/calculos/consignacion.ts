export interface RegistroConsignacionResult {
  monto: string;
  referencia: string;
  estado: 'pendiente';
}

export interface ImpactoConsignacionResult {
  monto: string;
  sesionCajaId: number;
  fechaAprobacion: string;
  tipoMovimiento: 'consignacion';
  esEntrada: false;
  estado: 'aprobada';
}

export interface RechazoConsignacionResult {
  estado: 'rechazada';
  motivoRechazo: string;
  alertaCajero: true;
}

// Crea registro pendiente — NO afecta saldo hasta aprobación
export function registrarConsignacion(
  monto: string,
  referencia: string,
  saldoSesion: string,
): RegistroConsignacionResult {
  if (Number(monto) <= 0) throw new Error('El monto de la consignación debe ser mayor a cero');
  if (Number(monto) > Number(saldoSesion)) {
    throw new Error(`Monto ${monto} supera el saldo de sesión ${saldoSesion}`);
  }
  if (!referencia || !referencia.trim()) throw new Error('La referencia de consignación es obligatoria');
  return { monto, referencia: referencia.trim(), estado: 'pendiente' };
}

// Al aprobar: registra MovimientoCaja — saldo disminuye
export function buildImpactoConsignacionAprobada(
  monto: string,
  sesionCajaId: number,
  fechaAprobacion: Date,
): ImpactoConsignacionResult {
  const iso = fechaAprobacion.toISOString().split('.')[0];
  return {
    monto,
    sesionCajaId,
    fechaAprobacion: iso,
    tipoMovimiento: 'consignacion',
    esEntrada: false,
    estado: 'aprobada',
  };
}

// Rechaza consignación pendiente — saldo no cambia
export function rechazarConsignacion(
  estadoActual: string,
  motivoRechazo: string,
): RechazoConsignacionResult {
  if (estadoActual !== 'pendiente') {
    throw new Error(
      `Solo se puede rechazar una consignación pendiente, estado actual: ${estadoActual}`,
    );
  }
  if (!motivoRechazo || !motivoRechazo.trim()) throw new Error('El motivo de rechazo es obligatorio');
  return { estado: 'rechazada', motivoRechazo: motivoRechazo.trim(), alertaCajero: true };
}

// Valida que el monto es positivo y no excede el saldo disponible
export function validarMontoConsignacion(monto: string, saldoActual: string): void {
  if (Number(monto) <= 0) throw new Error('El monto debe ser mayor a cero');
  if (Number(monto) > Number(saldoActual)) {
    throw new Error(`Monto ${monto} supera el saldo disponible ${saldoActual}`);
  }
}
