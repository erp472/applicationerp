export interface CierreForzadoResult {
  debeForzar: boolean;
  horasTranscurridas: number;
  maxHorasSesion: number;
  tipoAlerta: 'cierre_forzado' | null;
}

// Determina si la sesión debe cerrarse forzosamente por tiempo excedido
export function evaluarCierreForzado(
  horaApertura: Date,
  horaActual: Date,
  maxHorasSesion: number,
): CierreForzadoResult {
  const deltaMs = horaActual.getTime() - horaApertura.getTime();
  const horas = Math.round((deltaMs / 3_600_000) * 100) / 100;
  const debeForzar = horas > maxHorasSesion;
  return {
    debeForzar,
    horasTranscurridas: horas,
    maxHorasSesion,
    tipoAlerta: debeForzar ? 'cierre_forzado' : null,
  };
}
