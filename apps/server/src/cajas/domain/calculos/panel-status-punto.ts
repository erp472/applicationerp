// BR-CAJ-011: cuánto queda para abrir cajas nuevas en el punto.
// `base_general` es el techo que la Caja General autorizó al punto, no un piso que la
// bóveda deba conservar. Restarlo del saldo de la Caja Fuerte dejaba en cero a todo punto
// abierto con su base completa —Medellín abrió la Fuerte con sus 3.000.000 sobre una base
// de 3.000.000— y el supervisor no podía abrir ninguna caja.
// Con la Fuerte abierta lo repartible es su saldo tal cual: cada apertura ya se debita de
// esa misma sesión, así que el saldo vivo es lo que aún no se ha entregado.
export function calcularBaseDisponible(
  baseGeneral: number,
  cajaFuerteAbiertaSaldo: number | null,
  sumaAperturasStandalone: number,
): number {
  return cajaFuerteAbiertaSaldo !== null
    ? Math.max(0, cajaFuerteAbiertaSaldo)
    : Math.max(0, baseGeneral - sumaAperturasStandalone);
}

export interface PanelStatusPuntoResult {
  baseGeneral: string;
  cajaGeneral: string;
  cajaFuerteGeneral: string;
  basePagos: string;
  cajaPagos: string;
  cajaFuertePagos: string;
  acumuladoMonedaCirculante: string;
  tTransito: string;
  baseDisponible: string;
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
  baseDisponible: string,
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
    baseDisponible,
    debeReset,
    horaReset,
  };
}
