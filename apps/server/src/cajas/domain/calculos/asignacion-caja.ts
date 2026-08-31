import type { TipoCaja } from '../caja.entity.js';

// La Caja Fuerte custodia el efectivo del punto y la Caja Menor es su fondo de gastos:
// las dos son bolsillos de la caja principal y responden al supervisor del punto, no a
// un cajero propio. Solo reciben cajero las cajas que atienden público —las que venden
// (pos) o prestan servicios (pagos)—, porque son las únicas que abren un turno.
const TIPOS_OPERATIVOS: readonly TipoCaja[] = ['pos', 'pagos'];

export function esCajaOperativa(tipo: TipoCaja): boolean {
  return TIPOS_OPERATIVOS.includes(tipo);
}

export interface PerfilAsignable {
  rol:        string;
  sucursalId: number | null;
}

// Un administrador tiene permiso para *configurar* el punto, pero ponerlo como supervisor
// lo vuelve responsable de la custodia y rompe la segregación de funciones (RF-1.03): sería
// quien aprueba y quien ejecuta. El responsable tiene que estar destacado en la sucursal.
export function puedeSupervisarPunto(perfil: PerfilAsignable, sucursalPunto: number): boolean {
  return perfil.rol === 'SUPERVISOR_REGIONAL' && perfil.sucursalId === sucursalPunto;
}

export function puedeSerCajeroDeCaja(perfil: PerfilAsignable, sucursalCaja: number): boolean {
  return perfil.rol === 'CAJERO' && perfil.sucursalId === sucursalCaja;
}

// El cajero fijo que se asigna desde superadmin era solo un valor por defecto de la UI:
// si la apertura no lo mandaba, la sesión nacía sin dueño y cualquier cajero podía vender
// en ella —así el cajero 51 vendió $98.809 en POS-BOG-002-01, que estaba asignada al 55—.
// Heredarlo aquí hace que esa asignación sea vinculante sin depender del cliente.
// Los bolsillos (general, menor) no abren turno, así que siguen sin cajero.
export function resolverCajeroDeApertura(
  tipo: TipoCaja,
  cajeroAsignadoId: number | null | undefined,
  cajeroFijoId: number | null,
): number | null {
  if (!esCajaOperativa(tipo)) return null;
  return cajeroAsignadoId ?? cajeroFijoId ?? null;
}

export function requiereCajero(tipo: TipoCaja, cajeroResuelto: number | null): boolean {
  return esCajaOperativa(tipo) && cajeroResuelto === null;
}

export interface DuenoSesion {
  cajeroAsignadoId:  number | null;
  usuarioAperturaId: number;
}

// Quien vende en una sesión es su cajero, sin excepción por rol: un supervisor que vende
// en la caja de otro deja el movimiento atribuido a un custodio que no lo hizo. Las sesiones
// abiertas antes de que la apertura exigiera cajero no tienen dueño, y ahí responde quien abrió.
export function puedeOperarSesion(sesion: DuenoSesion, usuarioId: number): boolean {
  return sesion.cajeroAsignadoId !== null
    ? sesion.cajeroAsignadoId === usuarioId
    : sesion.usuarioAperturaId === usuarioId;
}
