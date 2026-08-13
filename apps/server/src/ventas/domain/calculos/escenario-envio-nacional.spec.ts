/**
 * Escenarios integrales de envío nacional.
 * Cada test encadena las funciones de cálculo exactamente como lo hace
 * cotizarEnvio() en ventas.service.ts.
 *
 * Tarifas reales del seed (seed-tarifas-correo.ts — NP-PAQ-NOR, Paquete Nacional Normal):
 *   Tramo A: 0-1 kg    → $4.850 plana (sin kg adicional)
 *   Tramo B: 1-2 kg    → $9.500 plana
 *   Tramo C: 2-5 kg    → $16.000 plana
 *   Tramo D: 5-10 kg   → $27.000 plana
 *   Tramo E: 10-20 kg  → $48.000 plana
 *   Tramo F: 20+ kg    → $75.000 base + $3.500/kg (adicional desde pesoMinKg=20)
 */
import { describe, it, expect } from 'vitest';
import { calcularPesoVolumetrico }          from './peso-volumetrico.js';
import { calcularPesoFacturado }            from './peso-facturado.js';
import { calcularKgAdicional }              from './kg-adicional.js';
import { calcularValorServicioTotal }       from './valor-servicio-total.js';
import { calcularSeguroPostal }             from './seguro-postal.js';
import { calcularValorEstampillasRequeridas, type DenominacionStock } from './valor-estampillas-requeridas.js';
import { calcularCertificacionCorreo }      from './calcular-certificacion-correo.js';
import { calcularTotalEnvioNacional }       from './total-envio-nacional.js';
import { validarPreporteado }               from './preporteado.js';
import { buildMixtoPreporteado }            from './mixto-preporteado.js';

const DENOMINACIONES: DenominacionStock[] = [
  { denominacion: '5000', stock: 50 },
  { denominacion: '1000', stock: 100 },
  { denominacion: '500',  stock: 100 },
  { denominacion: '100',  stock: 200 },
];

// Tarifas del seed real (NP-PAQ-NOR) — tarifa plana por tramo excepto el último
const TRAMO_A = { pesoMinKg: 0,  pesoMaxKg: 1,    tarifa:  4_850, tarifaKgAdicional: 0 };
const TRAMO_C = { pesoMinKg: 2,  pesoMaxKg: 5,    tarifa: 16_000, tarifaKgAdicional: 0 };
const TRAMO_D = { pesoMinKg: 5,  pesoMaxKg: 10,   tarifa: 27_000, tarifaKgAdicional: 0 };
const TRAMO_E = { pesoMinKg: 10, pesoMaxKg: 20,   tarifa: 48_000, tarifaKgAdicional: 0 };
const TRAMO_F = { pesoMinKg: 20, pesoMaxKg: null,  tarifa: 75_000, tarifaKgAdicional: 3_500 };

describe('Escenario envío nacional', () => {
  it('Paquete 0.5 kg — tramo A, tarifa plana $4.850', () => {
    // 20×15×10 cm → vol = 20*15*10/5000 = 0.6 kg → físico 0.5 < vol 0.6 → vol gana
    const pesoVol  = calcularPesoVolumetrico(20, 15, 10);
    const pesoPago = calcularPesoFacturado(0.5, pesoVol);

    expect(pesoVol).toBeCloseTo(0.6);
    expect(pesoPago).toBeCloseTo(0.6); // volumétrico gana

    // Tramo A es plano: sin kg adicional
    const adicional     = calcularKgAdicional(pesoPago, TRAMO_A.pesoMinKg, String(TRAMO_A.tarifaKgAdicional));
    const valorServicio = calcularValorServicioTotal(String(TRAMO_A.tarifa), adicional);
    const total         = calcularTotalEnvioNacional(valorServicio);

    expect(adicional).toBe('0');
    expect(valorServicio).toBe('4850');
    expect(total).toBe('4850');
  });

  it('Paquete 3 kg — tramo C, tarifa plana $16.000', () => {
    const pesoPago  = calcularPesoFacturado(3);
    const adicional = calcularKgAdicional(pesoPago, TRAMO_C.pesoMinKg, String(TRAMO_C.tarifaKgAdicional));
    const total     = calcularTotalEnvioNacional(calcularValorServicioTotal(String(TRAMO_C.tarifa), adicional));

    expect(adicional).toBe('0');
    expect(total).toBe('16000');
  });

  it('Paquete 7 kg — tramo D, tarifa plana $27.000', () => {
    const pesoPago  = calcularPesoFacturado(7);
    const adicional = calcularKgAdicional(pesoPago, TRAMO_D.pesoMinKg, String(TRAMO_D.tarifaKgAdicional));
    const total     = calcularTotalEnvioNacional(calcularValorServicioTotal(String(TRAMO_D.tarifa), adicional));

    expect(adicional).toBe('0');
    expect(total).toBe('27000');
  });

  it('Volumétrico gana — caja grande pero liviana (tramo E)', () => {
    // Peso físico: 5 kg, 55×40×40 cm
    // vol = 55*40*40/5000 = 88000/5000 = 17.6 kg → volumétrico gana → tramo E (10-20kg)
    const pesoVol  = calcularPesoVolumetrico(55, 40, 40);
    const pesoPago = calcularPesoFacturado(5, pesoVol);

    expect(pesoVol).toBeCloseTo(17.6);
    expect(pesoPago).toBeCloseTo(17.6); // volumétrico gana

    // Tramo E: tarifa plana $48.000, sin kg adicional
    const adicional     = calcularKgAdicional(pesoPago, TRAMO_E.pesoMinKg, String(TRAMO_E.tarifaKgAdicional));
    const valorServicio = calcularValorServicioTotal(String(TRAMO_E.tarifa), adicional);

    expect(adicional).toBe('0');
    expect(valorServicio).toBe('48000');
  });

  it('Tramo F: 25 kg — con kg adicional sobre pesoMin=20', () => {
    const pesoPago = calcularPesoFacturado(25);

    // exceso = 25 - 20 = 5 kg  →  5 * 3500 = $17.500
    const adicional     = calcularKgAdicional(pesoPago, TRAMO_F.pesoMinKg, String(TRAMO_F.tarifaKgAdicional));
    const valorServicio = calcularValorServicioTotal(String(TRAMO_F.tarifa), adicional);

    expect(adicional).toBe('17500');
    // 75000 + 17500 = 92500
    expect(valorServicio).toBe('92500');
  });

  it('Envío SPU con estampillas + seguro (mínimo $500) + certificación', () => {
    // Paquete 0.6 kg, tramo A ($4.850), valor declarado $50.000
    const pesoPago      = calcularPesoFacturado(0.6);
    const adicional     = calcularKgAdicional(pesoPago, TRAMO_A.pesoMinKg, String(TRAMO_A.tarifaKgAdicional));
    const valorServicio = calcularValorServicioTotal(String(TRAMO_A.tarifa), adicional);

    // Seguro 0.5% sobre $50.000 = $250 → mínimo $500 aplica → $500
    const seguro = calcularSeguroPostal('50000', '0.5', 500);

    // Estampillas: $4.850 no es composable con denominaciones de $100 mínimo.
    // El cartero redondea al próximo valor alcanzable: $5.000 (1×$5.000)
    const estampillas = calcularValorEstampillasRequeridas(true, '5000', DENOMINACIONES);

    // Certificación de correo: tarifa fija $1.800
    const certificacion = calcularCertificacionCorreo(1800);

    const total = calcularTotalEnvioNacional(
      valorServicio,
      estampillas.valorEstampillas,
      seguro,
      '0',
      String(certificacion),
    );

    expect(seguro).toBe('500');          // mínimo aplicado
    expect(estampillas.valorEstampillas).toBe('5000');
    expect(certificacion).toBe(1800);
    // 4850 + 5000 + 500 + 0 + 1800 = 12150
    expect(total).toBe('12150');
  });

  it('Pago completo con preporteado — monto exacto', () => {
    // Total del envío cotizado: $23.000
    // Cliente tiene preporteado exacto → validación OK, sin efectivo
    expect(() => validarPreporteado('23000', '23000')).not.toThrow();
  });

  it('Pago mixto: preporteado $15.000 + efectivo $8.000 sobre total $23.000', () => {
    const r = buildMixtoPreporteado('15000', '8000', '23000');

    expect(r.movimientoPreporteado.monto).toBe('15000');
    expect(r.movimientoPreporteado.tipoMovimiento).toBe('preporteado');
    expect(r.movimientoPreporteado.esEntrada).toBe(true);

    expect(r.movimientoEfectivo.monto).toBe('8000');
    expect(r.movimientoEfectivo.tipoMovimiento).toBe('efectivo');
    expect(r.movimientoEfectivo.esEntrada).toBe(true);

    const suma = Number(r.movimientoPreporteado.monto) + Number(r.movimientoEfectivo.monto);
    expect(suma).toBe(23000);
  });

  it('Preporteado incorrecto lanza error — no permite diferencia', () => {
    // Cotizado $23.000 pero cliente presenta preporteado de $20.000
    expect(() => validarPreporteado('20000', '23000')).toThrow('Preporteado no corresponde');
  });

  it('Estampillas: combinación mixta de denominaciones para $6.600', () => {
    // $5.000 + $1.000 + $500 + $100 = $6.600
    const r = calcularValorEstampillasRequeridas(true, '6600', DENOMINACIONES);
    const sumaReal = r.seleccion.reduce(
      (acc, d) => acc + Number(d.denominacion) * d.cantidad,
      0,
    );
    expect(r.valorEstampillas).toBe('6600');
    expect(sumaReal).toBe(6600);
  });
});
