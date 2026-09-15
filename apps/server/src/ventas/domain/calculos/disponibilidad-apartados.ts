export interface ApartadoPostalItem {
  apartadoId: number;
  estado: string;
  tamano: string;
  sucursalId: number;
}

export interface DisponibilidadResult {
  totalDisponibles: number;
  lista: ApartadoPostalItem[];
}

// Lista apartados disponibles por sucursal y tamaño opcional
export function calcularDisponibilidadApartados(
  apartados: ApartadoPostalItem[],
  sucursalId: number,
  tamano?: string,
): DisponibilidadResult {
  const disponibles = apartados.filter(
    a =>
      a.sucursalId === sucursalId &&
      a.estado === 'disponible' &&
      (tamano === undefined || a.tamano === tamano),
  );
  return { totalDisponibles: disponibles.length, lista: disponibles };
}
