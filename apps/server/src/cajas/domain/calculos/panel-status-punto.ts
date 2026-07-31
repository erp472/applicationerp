export interface PanelStatusPuntoResult {
  baseGeneral: string;
  cajaGeneral: string;
  cajaFuerteGeneral: string;
  basePagos: string;
  cajaPagos: string;
  cajaFuertePagos: string;
  acumuladoMonedaCirculante: string;
  tTransito: string;
  debeReset: boolean;
  horaReset: string | null;
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
  tTransito: string,
  debeReset = false,
  horaReset: string | null = null,
): PanelStatusPuntoResult {
  return {
    baseGeneral,
    cajaGeneral,
    cajaFuerteGeneral,
    basePagos,
    cajaPagos,
    cajaFuertePagos,
    acumuladoMonedaCirculante,
    tTransito,
    debeReset,
    horaReset,
  };
}
