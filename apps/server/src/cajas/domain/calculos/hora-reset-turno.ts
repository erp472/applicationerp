export interface HoraResetResult {
  debeResetear: boolean;
  horaReset: string;
}

// Determina si el turno debe cerrarse y reabrirse por reset diario.
// horaActual y horaReset en formato "HH:MM" — comparación lexicográfica.
export function evaluarHoraReset(horaActual: string, horaReset: string): HoraResetResult {
  return {
    debeResetear: horaActual >= horaReset,
    horaReset,
  };
}
