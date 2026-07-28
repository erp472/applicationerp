export interface LimiteEfectivoResult {
  superaLimite: boolean;
  excedente: string;
  tipoAlerta: 'limite_efectivo_caja' | null;
}

// Evalúa si el saldo supera el límite de alerta de efectivo configurado en cajas.limite_alerta
export function evaluarLimiteEfectivo(saldoActual: string, limiteAlerta: string): LimiteEfectivoResult {
  const saldo = Number(saldoActual);
  const limite = Number(limiteAlerta);
  const supera = saldo > limite;
  return {
    superaLimite: supera,
    excedente: supera ? (saldo - limite).toFixed(2) : '0.00',
    tipoAlerta: supera ? 'limite_efectivo_caja' : null,
  };
}
