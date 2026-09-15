export interface TarifaEspecialCantidad {
  minCantidad: number;
  maxCantidad: number | null; // null = sin límite superior (tramo abierto)
  precioUnitario: string;
}

// Primer tramo donde minCantidad <= cantidad <= maxCantidad. Error si ninguno aplica.
export function calcularPrecioPorCantidad(
  tarifas: TarifaEspecialCantidad[],
  cantidad: number,
): string {
  const tarifa = tarifas.find(
    t => t.minCantidad <= cantidad && (t.maxCantidad === null || cantidad <= t.maxCantidad),
  );
  if (!tarifa) {
    throw new Error(
      `Cantidad ${cantidad} no está cubierta por ningún tramo de tarifa. ` +
        'Verifique la configuración de TarifaEspecialCantidad.',
    );
  }
  return tarifa.precioUnitario;
}
