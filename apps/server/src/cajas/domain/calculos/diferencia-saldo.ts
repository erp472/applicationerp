export interface DiferenciaFaltanteResult {
  faltante: string;
  tipoMovimiento: 'diferencia_faltante';
  estado: 'pendiente';
  esEntrada: false;
}

export interface DiferenciaSobranteResult {
  sobrante: string;
  tipoMovimiento: 'diferencia_sobrante';
  estado: 'pendiente';
  esEntrada: true;
}

export interface ImpactoDiferenciaResult {
  monto: string;
  tipo: 'sobrante' | 'faltante';
  esEntrada: boolean;
  saldoAjustado: string;
  estado: 'aprobada';
}

// sistema > físico → faltante; estado pendiente de aprobación tesorería
export function calcularDiferenciaFaltante(
  saldoSistema: string,
  saldoFisico: string,
): DiferenciaFaltanteResult {
  const sistema = Number(saldoSistema);
  const fisico = Number(saldoFisico);
  if (sistema <= fisico) {
    throw new Error('No hay faltante: saldo_sistema debe ser mayor que saldo_fisico');
  }
  return {
    faltante: (sistema - fisico).toFixed(2),
    tipoMovimiento: 'diferencia_faltante',
    estado: 'pendiente',
    esEntrada: false,
  };
}

// físico > sistema → sobrante; entra en investigación
export function calcularDiferenciaSobrante(
  saldoSistema: string,
  saldoFisico: string,
): DiferenciaSobranteResult {
  const sistema = Number(saldoSistema);
  const fisico = Number(saldoFisico);
  if (fisico <= sistema) {
    throw new Error('No hay sobrante: saldo_fisico debe ser mayor que saldo_sistema');
  }
  return {
    sobrante: (fisico - sistema).toFixed(2),
    tipoMovimiento: 'diferencia_sobrante',
    estado: 'pendiente',
    esEntrada: true,
  };
}

// Al aprobar diferencia: ajusta saldo de la sesión
export function calcularImpactoDiferenciaAprobada(
  monto: string,
  tipo: 'sobrante' | 'faltante',
  saldoActual: string,
): ImpactoDiferenciaResult {
  const m = Number(monto);
  const s = Number(saldoActual);
  if (tipo !== 'sobrante' && tipo !== 'faltante') {
    throw new Error(`Tipo de diferencia inválido: ${tipo}`);
  }
  const esEntrada = tipo === 'sobrante';
  return {
    monto,
    tipo,
    esEntrada,
    saldoAjustado: (esEntrada ? s + m : s - m).toFixed(2),
    estado: 'aprobada',
  };
}
