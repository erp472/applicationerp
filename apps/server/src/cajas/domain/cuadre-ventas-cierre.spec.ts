import { describe, it, expect } from 'vitest';
import {
  deltaEfectivo,
  TIPOS_MOVIMIENTO_ENTRADA,
  TIPOS_MOVIMIENTO_SALIDA,
} from './business-rules.js';
import { repartirPagoPorMedio } from './calculos/reparto-medio-pago.js';
import { calcularSaldoPorMedioPago, type MedioPago } from './calculos/saldo-por-medio-pago.js';
import { calcularDevolucionAPrincipal } from './calculos/devolucion-principal.js';
import { compararArqueoConSaldo, type Denominacion } from './calculos/arqueo-denominaciones.js';

// Prueba de cuadre de punta a punta: un día completo de ventas en tres cajas POS,
// su cierre y la consolidación en la Caja Fuerte. Compone las mismas funciones de
// dominio que usa producción, así que si alguna cambia el cuadre falla aquí.

interface Movimiento {
  tipo:       string;
  monto:      string;
  medioPago?: MedioPago;
}

class SesionSimulada {
  readonly movimientos: Movimiento[] = [];

  constructor(readonly nombre: string, readonly montoApertura: string) {}

  // Espejo de CajasService.registrarMovimientoVenta
  registrarVenta(
    tipo: string,
    monto: string,
    medioPago?: MedioPago,
    montoEfectivo?: string | number,
  ) {
    for (const parte of repartirPagoPorMedio(monto, medioPago, montoEfectivo)) {
      this.movimientos.push({ tipo, monto: parte.monto, medioPago: parte.medioPago });
    }
  }

  // Movimientos internos de caja: sin medio de pago declarado = efectivo físico
  registrarInterno(tipo: string, monto: string) {
    this.movimientos.push({ tipo, monto });
  }

  // Espejo de PrismaSesionesCajaRepository.calcularSaldo
  get saldoEfectivo(): string {
    let saldo = Number(this.montoApertura);
    for (const m of this.movimientos) {
      saldo += deltaEfectivo(m.tipo, Number(m.monto), m.medioPago);
    }
    return saldo.toFixed(2);
  }

  // Espejo del bloque saldoPorMedioPago de PrismaSesionesCajaRepository.getStatusPunto
  get facturacionPorMedio(): Record<MedioPago, string> {
    return calcularSaldoPorMedioPago(
      this.movimientos
        .filter(m => TIPOS_MOVIMIENTO_ENTRADA.has(m.tipo) || TIPOS_MOVIMIENTO_SALIDA.has(m.tipo))
        .map(m => ({
          medioPago: m.medioPago,
          monto:     m.monto,
          esEntrada: TIPOS_MOVIMIENTO_ENTRADA.has(m.tipo),
        })),
    );
  }

  get totalNoEfectivo(): number {
    return (Object.entries(this.facturacionPorMedio) as [MedioPago, string][])
      .filter(([medio]) => medio !== 'efectivo')
      .reduce((acc, [, monto]) => acc + Number(monto), 0);
  }
}

// Espejo de CajasService.cerrarAuxiliar
function cerrarAuxiliar(
  auxiliar: SesionSimulada,
  fuerte:   SesionSimulada,
  denominaciones: Denominacion[],
) {
  const saldoEsperado = auxiliar.saldoEfectivo;
  const arqueo        = compararArqueoConSaldo(denominaciones, saldoEsperado);
  const saldoNeto     = Math.max(
    0,
    Number(saldoEsperado) - Number(auxiliar.montoApertura),
  ).toFixed(2);

  if (Number(saldoNeto) > 0) {
    const devolucion = calcularDevolucionAPrincipal(saldoNeto);
    auxiliar.registrarInterno(devolucion.movimientoAuxiliar.tipoMovimiento, devolucion.monto);
    fuerte.registrarInterno(devolucion.movimientoPrincipal.tipoMovimiento, devolucion.monto);
  }

  return { saldoEsperado, saldoNeto, arqueo };
}

// ── El día de trabajo ────────────────────────────────────────────────────────

interface VentaDelDia {
  caja:           'POS-01' | 'POS-02' | 'POS-03';
  tipo:           string;
  monto:          string;
  medioPago?:     MedioPago;
  montoEfectivo?: number;
}

const BASES = { 'POS-01': '200000', 'POS-02': '150000', 'POS-03': '100000' } as const;

const VENTAS_DEL_DIA: VentaDelDia[] = [
  { caja: 'POS-01', tipo: 'venta_producto',   monto: '350000', medioPago: 'tarjeta_credito' },
  { caja: 'POS-01', tipo: 'venta_servicio',   monto: '45000',  medioPago: 'efectivo' },
  { caja: 'POS-01', tipo: 'venta_producto',   monto: '11204',  medioPago: 'efectivo' },
  { caja: 'POS-01', tipo: 'apartado_postal',  monto: '87500',  medioPago: 'preporteado' },
  { caja: 'POS-01', tipo: 'venta_estampilla', monto: '5250',   medioPago: 'mixto_preporteado', montoEfectivo: 2750 },

  { caja: 'POS-02', tipo: 'venta_producto',   monto: '120000', medioPago: 'efectivo' },
  { caja: 'POS-02', tipo: 'venta_servicio',   monto: '80000',  medioPago: 'transferencia' },
  { caja: 'POS-02', tipo: 'venta_estampilla', monto: '3300',   medioPago: 'estampilla', montoEfectivo: 3300 },

  { caja: 'POS-03', tipo: 'venta_producto',   monto: '500000', medioPago: 'consignacion' },
  { caja: 'POS-03', tipo: 'venta_producto',   monto: '25000',  medioPago: 'efectivo' },
];

const SALIDAS_DEL_DIA = [
  { caja: 'POS-02', tipo: 'giro_pago',    monto: '50000' },
  { caja: 'POS-03', tipo: 'consignacion', monto: '60000' },
] as const;

function montarDia() {
  const fuerte = new SesionSimulada('Caja Fuerte', '3000000');
  const cajas: Record<VentaDelDia['caja'], SesionSimulada> = {
    'POS-01': new SesionSimulada('POS-01', '0'),
    'POS-02': new SesionSimulada('POS-02', '0'),
    'POS-03': new SesionSimulada('POS-03', '0'),
  };

  // La base sale de la Caja Fuerte: los POS abren en 0 y reciben por custodia
  for (const [nombre, base] of Object.entries(BASES)) {
    fuerte.registrarInterno('cambio_custodia_out', base);
    cajas[nombre as VentaDelDia['caja']].registrarInterno('cambio_custodia_in', base);
  }

  for (const v of VENTAS_DEL_DIA) {
    cajas[v.caja].registrarVenta(v.tipo, v.monto, v.medioPago, v.montoEfectivo);
  }
  for (const s of SALIDAS_DEL_DIA) {
    cajas[s.caja].registrarInterno(s.tipo, s.monto);
  }

  return { fuerte, cajas, puntos: Object.values(cajas) };
}

// Efectivo real del día, contado a mano:
//   POS-01: 200.000 base + 45.000 + 11.204 + 2.750 (porción efectivo del mixto) = 258.954
//   POS-02: 150.000 base + 120.000 + 3.300 − 50.000 giro                        = 223.300
//   POS-03: 100.000 base + 25.000 − 60.000 consignación                         =  65.000
const EFECTIVO_ESPERADO = { 'POS-01': '258954.00', 'POS-02': '223300.00', 'POS-03': '65000.00' };

// Ventas que se facturan pero nunca entran al cajón:
// 350.000 tarjeta + 87.500 preporteado + 2.500 porción no-efectivo del mixto
// + 80.000 transferencia + 500.000 consignación
const NO_EFECTIVO_TOTAL = 1_020_000;

// 3.000.000 iniciales − 450.000 de bases + 547.254 recibidos en los tres cierres
const FUERTE_AL_CIERRE = '3097254.00';

// Arqueo exacto de POS-02: 223.300
const ARQUEO_POS02: Denominacion[] = [
  { denominacion: 100000, cantidad: 2 },
  { denominacion:  20000, cantidad: 1 },
  { denominacion:   2000, cantidad: 1 },
  { denominacion:   1000, cantidad: 1 },
  { denominacion:    200, cantidad: 1 },
  { denominacion:    100, cantidad: 1 },
];

describe('Cuadre de ventas y cierre', () => {

  describe('Registro de ventas', () => {
    it('ninguna venta crea ni pierde dinero al partirse por medio de pago', () => {
      for (const v of VENTAS_DEL_DIA) {
        const partes = repartirPagoPorMedio(v.monto, v.medioPago, v.montoEfectivo);
        const suma   = partes.reduce((acc, p) => acc + Number(p.monto), 0);
        expect(suma, `${v.caja} ${v.tipo} ${v.monto}`).toBe(Number(v.monto));
      }
    });

    it('el saldo de cada caja es el efectivo del cajón, no la facturación', () => {
      const { cajas } = montarDia();
      for (const [nombre, esperado] of Object.entries(EFECTIVO_ESPERADO)) {
        expect(cajas[nombre as VentaDelDia['caja']].saldoEfectivo, nombre).toBe(esperado);
      }
    });

    it('una venta de 350.000 con tarjeta se factura pero no suma al cajón', () => {
      const { cajas } = montarDia();
      const pos1 = cajas['POS-01'];
      expect(pos1.facturacionPorMedio.tarjeta_credito).toBe('350000.00');
      expect(pos1.saldoEfectivo).toBe('258954.00');
    });

    it('el pago mixto acredita solo su porción en efectivo', () => {
      const { cajas } = montarDia();
      const pos1 = cajas['POS-01'];
      expect(pos1.facturacionPorMedio.mixto_preporteado).toBe('2500.00');
      const efectivoDeVentas = 45_000 + 11_204 + 2_750;
      expect(Number(pos1.saldoEfectivo) - Number(BASES['POS-01'])).toBe(efectivoDeVentas);
    });

    it('el desglose por medio de pago y el saldo del cajón coinciden en efectivo', () => {
      // Dos rutas de cálculo independientes (deltaEfectivo vs calcularSaldoPorMedioPago)
      // deben llegar al mismo número, o el arqueo y el reporte se contradicen.
      const { puntos } = montarDia();
      for (const caja of puntos) {
        expect(caja.facturacionPorMedio.efectivo, caja.nombre).toBe(caja.saldoEfectivo);
      }
    });
  });

  describe('Cierre y consolidación', () => {
    it('cada caja entrega a la fuerte exactamente el efectivo que tenía', () => {
      const { fuerte, puntos } = montarDia();
      for (const caja of puntos) {
        const esperado = caja.saldoEfectivo;
        const { saldoNeto } = cerrarAuxiliar(caja, fuerte, []);
        expect(saldoNeto, caja.nombre).toBe(esperado);
        expect(caja.saldoEfectivo, `${caja.nombre} queda en cero`).toBe('0.00');
      }
    });

    it('la caja fuerte consolida el punto sin inflarse con ventas electrónicas', () => {
      const { fuerte, puntos } = montarDia();
      for (const caja of puntos) cerrarAuxiliar(caja, fuerte, []);
      expect(fuerte.saldoEfectivo).toBe(FUERTE_AL_CIERRE);
    });

    it('el efectivo del punto solo cambia por el efectivo neto de las ventas', () => {
      const { fuerte, puntos } = montarDia();
      for (const caja of puntos) cerrarAuxiliar(caja, fuerte, []);
      const efectivoNetoVentas = 45_000 + 11_204 + 2_750 + 120_000 + 3_300 + 25_000
                               - 50_000 - 60_000;
      expect(Number(fuerte.saldoEfectivo) - 3_000_000).toBe(efectivoNetoVentas);
    });

    it('conserva la masa: todo lo que sale de una sesión entra en otra', () => {
      const { fuerte, puntos } = montarDia();
      for (const caja of puntos) cerrarAuxiliar(caja, fuerte, []);
      const todos = [fuerte, ...puntos].flatMap(s => s.movimientos);
      const suma = (tipo: string) => todos
        .filter(m => m.tipo === tipo)
        .reduce((acc, m) => acc + Number(m.monto), 0);
      expect(suma('cambio_custodia_out')).toBe(suma('cambio_custodia_in'));
    });

    it('la venta no-efectivo queda registrada aparte, no perdida', () => {
      const { puntos } = montarDia();
      const total = puntos.reduce((acc, c) => acc + c.totalNoEfectivo, 0);
      expect(total).toBe(NO_EFECTIVO_TOTAL);
    });
  });

  describe('Arqueo', () => {
    it('cuadra cuando el cajero cuenta el efectivo real del cajón', () => {
      const { fuerte, cajas } = montarDia();
      const { arqueo } = cerrarAuxiliar(cajas['POS-02'], fuerte, ARQUEO_POS02);
      expect(arqueo.total).toBe('223300.00');
      expect(arqueo.diferencia).toBe('0.00');
      expect(arqueo.tipoDiferencia).toBe('cuadre');
    });

    it('reporta solo el dinero realmente ausente, no la venta electrónica', () => {
      // POS-02 vendió 80.000 por transferencia; si falta un billete de 1.000
      // el faltante debe ser 1.000, no 81.000.
      const { fuerte, cajas } = montarDia();
      const faltanUnMil = ARQUEO_POS02.filter(d => d.denominacion !== 1000);
      const { arqueo } = cerrarAuxiliar(cajas['POS-02'], fuerte, faltanUnMil);
      expect(arqueo.tipoDiferencia).toBe('faltante');
      expect(arqueo.diferencia).toBe('-1000.00');
    });
  });

  describe('Regresión: adiciones fantasma en la caja principal', () => {
    it('no acumula en la fuerte los medios que nunca entraron al cajón', () => {
      // Antes del arreglo, calcularSaldo sumaba todo movimiento de venta sin mirar
      // el medio de pago: el cierre arrastraba esos 1.020.000 a la Caja Fuerte y
      // el saldo del punto crecía cada día sin dinero físico detrás.
      const { fuerte, puntos } = montarDia();
      for (const caja of puntos) cerrarAuxiliar(caja, fuerte, []);
      const saldoInflado = Number(FUERTE_AL_CIERRE) + NO_EFECTIVO_TOTAL;
      expect(Number(fuerte.saldoEfectivo)).not.toBe(saldoInflado);
      expect(Number(fuerte.saldoEfectivo)).toBe(Number(FUERTE_AL_CIERRE));
    });

    it('cerrar el mismo día dos veces no duplica el saldo de la fuerte', () => {
      const { fuerte, puntos } = montarDia();
      for (const caja of puntos) cerrarAuxiliar(caja, fuerte, []);
      const trasPrimerCierre = fuerte.saldoEfectivo;
      // Una sesión ya cerrada tiene saldo 0: reintentar no mueve nada.
      for (const caja of puntos) cerrarAuxiliar(caja, fuerte, []);
      expect(fuerte.saldoEfectivo).toBe(trasPrimerCierre);
    });
  });
});
