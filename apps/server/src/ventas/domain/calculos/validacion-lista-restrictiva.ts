export interface EntradaListaRestrictiva {
  cedula: string;
  tipoAlerta: 'alerta' | 'bloqueado';
}

export interface ValidacionListaResult {
  resultado: 'ok' | 'alerta' | 'bloqueado';
  requiereRevisionManual: boolean;
}

export function validarListaRestrictiva(
  cedula: string,
  listas: EntradaListaRestrictiva[],
  modoVerificacion: 'automatico' | 'manual' = 'automatico',
): ValidacionListaResult {
  const entrada = listas.find((e) => e.cedula === cedula);
  if (entrada) {
    const tipo = entrada.tipoAlerta;
    return {
      resultado: tipo,
      requiereRevisionManual: tipo === 'alerta' || modoVerificacion === 'manual',
    };
  }
  return { resultado: 'ok', requiereRevisionManual: modoVerificacion === 'manual' };
}
