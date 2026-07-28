export interface TarifaUpuRow {
  paisDestino: string;
  pesoMinKg: string;
  pesoMaxKg: string;
  tarifaCop: string;
  vigente: boolean;
}

export function calcularTarifaInternacionalMs(
  tarifasUpu: TarifaUpuRow[],
  paisDestino: string,
  pesoFacturado: number,
): string {
  const tarifa = tarifasUpu.find(
    (t) =>
      t.paisDestino === paisDestino &&
      Number(t.pesoMinKg) <= pesoFacturado &&
      pesoFacturado <= Number(t.pesoMaxKg) &&
      t.vigente,
  );
  if (!tarifa) {
    throw new Error(`No hay tarifa UPU para '${paisDestino}' con peso ${pesoFacturado} kg`);
  }
  return tarifa.tarifaCop;
}
