export interface PanelStatusPuntoResult {
  baseGeneral: string;
  cajaGeneral: string;
  cajaFuerteGeneral: string;
  basePagos: string;
  cajaPagos: string;
  cajaFuertePagos: string;
  acumuladoMonedaCirculante: string;
}

// Composición del panel de status del punto de venta — todos los campos requeridos
export function componerPanelStatus(
  baseGeneral: string,
  cajaGeneral: string,
  cajaFuerteGeneral: string,
  basePagos: string,
  cajaPagos: string,
  cajaFuertePagos: string,
  acumuladoMonedaCirculante: string,
): PanelStatusPuntoResult {
  return {
    baseGeneral,
    cajaGeneral,
    cajaFuerteGeneral,
    basePagos,
    cajaPagos,
    cajaFuertePagos,
    acumuladoMonedaCirculante,
  };
}
