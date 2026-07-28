export function calcularKgAdicional(
  pesoTarificado: number,
  pesoMaxKgTramo: number,
  tarifaKgAdicional: string,
): string {
  const kgExtra = Math.max(0, pesoTarificado - pesoMaxKgTramo);
  return String(kgExtra * Number(tarifaKgAdicional));
}
