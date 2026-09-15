export interface AlertaVencimientoResult {
  generarAlerta: boolean;
  payloadAlerta: {
    tipo: 'apartado_por_vencer';
    apartadoId: number;
    clienteId: number;
    sucursalId: number;
    diasRestantes: number;
  } | null;
}

// Genera alerta si diasRestantes <= umbral configurado (dias_alerta_vencimiento)
export function evaluarAlertaVencimientoApartado(
  diasRestantes: number,
  diasAlertaVencimiento: number,
  apartadoId: number,
  clienteId: number,
  sucursalId: number,
): AlertaVencimientoResult {
  const generar = diasRestantes <= diasAlertaVencimiento;
  return {
    generarAlerta: generar,
    payloadAlerta: generar
      ? { tipo: 'apartado_por_vencer', apartadoId, clienteId, sucursalId, diasRestantes }
      : null,
  };
}
