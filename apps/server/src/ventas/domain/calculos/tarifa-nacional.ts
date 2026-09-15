export interface TarifaServicioRow {
  servicioId: number;
  ciudadDestino: string;
  pesoMinKg: string;
  pesoMaxKg: string;
  tipoClienteId: number | null;
  tarifaBase: string;
  tarifaKgAdicional?: string;
  vigente: boolean;
}

export interface TarifaNacionalResult {
  tarifaBase: string;
  tarifaKgAdicional: string;
  pesoMaxKgTramo: number;
}

function coincide(
  t: TarifaServicioRow,
  servicioId: number,
  ciudadDestino: string,
  peso: number,
  tipoClienteId: number | null,
): boolean {
  return (
    t.servicioId === servicioId &&
    t.ciudadDestino === ciudadDestino &&
    Number(t.pesoMinKg) <= peso &&
    peso <= Number(t.pesoMaxKg) &&
    t.vigente &&
    t.tipoClienteId === tipoClienteId
  );
}

export function calcularTarifaNacional(
  tarifas: TarifaServicioRow[],
  servicioId: number,
  ciudadDestino: string,
  pesoTarificado: number,
  tipoClienteId: number | null,
): TarifaNacionalResult {
  if (tipoClienteId !== null) {
    const especifica = tarifas.find((t) =>
      coincide(t, servicioId, ciudadDestino, pesoTarificado, tipoClienteId),
    );
    if (especifica) {
      return {
        tarifaBase: especifica.tarifaBase,
        tarifaKgAdicional: especifica.tarifaKgAdicional ?? '0',
        pesoMaxKgTramo: Number(especifica.pesoMaxKg),
      };
    }
  }

  const retail = tarifas.find((t) =>
    coincide(t, servicioId, ciudadDestino, pesoTarificado, null),
  );
  if (retail) {
    return {
      tarifaBase: retail.tarifaBase,
      tarifaKgAdicional: retail.tarifaKgAdicional ?? '0',
      pesoMaxKgTramo: Number(retail.pesoMaxKg),
    };
  }

  throw new Error(
    `No se encontró tarifa para servicio ${servicioId}, destino '${ciudadDestino}', peso ${pesoTarificado} kg`,
  );
}
