export interface DenominacionStock {
  denominacion: string;
  stock: number;
}

export interface SeleccionEstampilla {
  denominacion: string;
  cantidad: number;
}

export interface ValorEstampillasResult {
  valorEstampillas: string;
  seleccion: SeleccionEstampilla[];
}

export function calcularValorEstampillasRequeridas(
  requiereEstampilla: boolean,
  valorServicio: string,
  denominacionesDisponibles: DenominacionStock[],
): ValorEstampillasResult {
  if (!requiereEstampilla) {
    return { valorEstampillas: '0', seleccion: [] };
  }

  let restante = Number(valorServicio);
  const seleccion: SeleccionEstampilla[] = [];

  if (restante === 0) {
    return { valorEstampillas: '0', seleccion: [] };
  }

  const ordenadas = [...denominacionesDisponibles].sort(
    (a, b) => Number(b.denominacion) - Number(a.denominacion),
  );

  for (const d of ordenadas) {
    const denom = Number(d.denominacion);
    if (restante <= 0 || denom > restante) continue;
    const cantidadNecesaria = Math.floor(restante / denom);
    const cantidadUsada = Math.min(cantidadNecesaria, d.stock);
    if (cantidadUsada > 0) {
      seleccion.push({ denominacion: d.denominacion, cantidad: cantidadUsada });
      restante -= denom * cantidadUsada;
    }
  }

  if (restante !== 0) {
    throw new Error(
      `No hay combinación de estampillas disponibles que cubra exactamente ${valorServicio}. Faltante: ${restante}`,
    );
  }

  return { valorEstampillas: valorServicio, seleccion };
}
