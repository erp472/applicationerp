// pesoBaseKg = pesoMinKg del tramo (umbral desde donde aplica la tarifa adicional)
export function calcularKgAdicional(
  pesoTarificado: number,
  pesoBaseKg: number,
  tarifaKgAdicional: string,
): string {
  const kgExtra = Math.max(0, pesoTarificado - pesoBaseKg);
  return String(kgExtra * Number(tarifaKgAdicional));
}
