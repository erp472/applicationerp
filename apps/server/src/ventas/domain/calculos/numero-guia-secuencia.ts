// Weights for UPU S10 check digit (left-to-right over the 8-digit serial)
const S10_WEIGHTS = [8, 6, 4, 2, 3, 5, 9, 7] as const;

/**
 * Calculates the UPU S10 check digit for an 8-digit serial string.
 * Algorithm: sum(digit[i] * weight[i]) mod 11; special cases for 0 and 1.
 */
export function calcularDigitoVerificadorS10(serial8: string): number {
  if (serial8.length !== 8) throw new Error('El serial S10 debe tener exactamente 8 dígitos');
  const sum = S10_WEIGHTS.reduce((acc, w, i) => acc + Number(serial8[i]) * w, 0);
  const rem = sum % 11;
  if (rem === 0) return 5;
  if (rem === 1) return 0;
  return 11 - rem;
}

/**
 * Generates the full UPU S10 barcode tracking code.
 * Format: {prefix}{serial8}{checkDigit}{country}
 * Example: RA + 18519403 + 8 + CO = RA185194038CO
 */
export function generarCodigoTrackingS10(prefijo: string, consecutivo: number, pais = 'CO'): string {
  const serial8 = String(consecutivo).padStart(8, '0');
  const digito  = calcularDigitoVerificadorS10(serial8);
  return `${prefijo}${serial8}${digito}${pais}`;
}

/**
 * Generates the human-readable guide number ({prefix}{serial8}).
 * Supports SIGMA-assigned guide numbers for external integrations.
 */
export function generarNumeroGuiaSecuencia(
  prefijo: string,
  consecutivo: number,
  usaSigma = false,
  guiaSigma?: string | null,
): string {
  if (usaSigma) {
    if (!guiaSigma) throw new Error('Se requiere guia_sigma cuando usa_sigma es True');
    return guiaSigma;
  }
  if (consecutivo <= 0) throw new Error('El consecutivo debe ser mayor a cero');
  return `${prefijo}${String(consecutivo).padStart(8, '0')}`;
}
