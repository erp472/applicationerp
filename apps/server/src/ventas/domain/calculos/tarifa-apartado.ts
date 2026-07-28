export interface TarifaApartado {
  sucursalId: number;
  tamano: string;
  tarifaAnual: string;
  vigente: boolean;
}

// Lee tarifa anual de BD. Nunca usa valor hardcodeado.
export function calcularTarifaApartado(
  tarifas: TarifaApartado[],
  sucursalId: number,
  tamano: string,
): string {
  const tarifa = tarifas.find(
    t => t.sucursalId === sucursalId && t.tamano === tamano && t.vigente,
  );
  if (!tarifa) {
    throw new Error(
      `No se encontró tarifa vigente para sucursal ${sucursalId}, tamaño '${tamano}'`,
    );
  }
  return tarifa.tarifaAnual;
}
