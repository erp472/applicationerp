export interface AlertaReposicionResult {
  necesitaReposicion: boolean;
  faltante: string;
  tipoAlerta: 'reposicion_caja' | null;
}

// Evalúa si la caja auxiliar necesita reposición de fondos (saldo < base_dia)
export function evaluarAlertaReposicion(saldoAuxiliar: string, baseDia: string): AlertaReposicionResult {
  const saldo = Number(saldoAuxiliar);
  const base = Number(baseDia);
  const necesita = saldo < base;
  return {
    necesitaReposicion: necesita,
    faltante: necesita ? (base - saldo).toFixed(2) : '0.00',
    tipoAlerta: necesita ? 'reposicion_caja' : null,
  };
}
