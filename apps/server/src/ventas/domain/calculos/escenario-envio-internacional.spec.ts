/**
 * Escenarios integrales de envío internacional.
 * Encadena las funciones de cálculo tal como lo hace cotizarEnvio()
 * para servicios con paisDestino !== 'CO'.
 *
 * Tarifas UPU mock (Mercancías/Small Packets):
 *   USA: [0-1kg=$45.000] [1-5kg=$90.000] [5-10kg=$150.000]
 *   ESP: [0-2kg=$60.000] [2-5kg=$110.000]
 *   BRA: [0-2kg=$55.000]
 *
 * Factor volumétrico internacional: 2500 (UPU estándar)
 */
import { describe, it, expect } from 'vitest';
import { calcularPesoVolumetricoIntl }      from './peso-volumetrico-intl.js';
import { calcularPesoFacturado }            from './peso-facturado.js';
import { calcularTarifaInternacionalMs, type TarifaUpuRow } from './tarifa-internacional-ms.js';
import { calcularSeguroPostal }             from './seguro-postal.js';
import { calcularTotalEnvioInternacional }  from './total-envio-internacional.js';
import { calcularImpuestosAduanaDestino }   from './impuestos-aduana-destino.js';
import { calcularConversionMoneda }         from './conversion-moneda.js';
import { validarValorDeclaradoIntl }        from './validar-valor-declarado-intl.js';

const FACTOR_UPU = 6000; // UPU estándar internacional

const TARIFAS_UPU: TarifaUpuRow[] = [
  { paisDestino: 'USA', pesoMinKg: '0', pesoMaxKg: '1',  tarifaCop: '45000',  vigente: true },
  { paisDestino: 'USA', pesoMinKg: '1', pesoMaxKg: '5',  tarifaCop: '90000',  vigente: true },
  { paisDestino: 'USA', pesoMinKg: '5', pesoMaxKg: '10', tarifaCop: '150000', vigente: true },
  { paisDestino: 'ESP', pesoMinKg: '0', pesoMaxKg: '2',  tarifaCop: '60000',  vigente: true },
  { paisDestino: 'ESP', pesoMinKg: '2', pesoMaxKg: '5',  tarifaCop: '110000', vigente: true },
  { paisDestino: 'BRA', pesoMinKg: '0', pesoMaxKg: '2',  tarifaCop: '55000',  vigente: true },
];

describe('Escenario envío internacional', () => {
  it('USA 0.5 kg — primer tramo, sin extras', () => {
    const pesoFisico = 0.5;
    const tarifa     = calcularTarifaInternacionalMs(TARIFAS_UPU, 'USA', pesoFisico);
    const total      = calcularTotalEnvioInternacional(tarifa);

    expect(tarifa).toBe('45000');
    expect(total).toBe('45000');
  });

  it('USA 3 kg — segundo tramo, sin extras', () => {
    const tarifa = calcularTarifaInternacionalMs(TARIFAS_UPU, 'USA', 3);
    const total  = calcularTotalEnvioInternacional(tarifa);

    expect(tarifa).toBe('90000');
    expect(total).toBe('90000');
  });

  it('USA 3 kg — con seguro (1%) y estampilla', () => {
    // Tarifa $90.000, valor declarado $300.000
    // Seguro 1% → $3.000, estampilla $4.000
    const tarifa  = calcularTarifaInternacionalMs(TARIFAS_UPU, 'USA', 3);
    const seguro  = calcularSeguroPostal('300000', '1');
    const total   = calcularTotalEnvioInternacional(tarifa, seguro, '4000');

    expect(seguro).toBe('3000');
    // 90000 + 3000 + 4000 = 97000
    expect(total).toBe('97000');
  });

  it('España 1.5 kg — cae en primer tramo', () => {
    const tarifa = calcularTarifaInternacionalMs(TARIFAS_UPU, 'ESP', 1.5);
    const total  = calcularTotalEnvioInternacional(tarifa);

    expect(tarifa).toBe('60000');
    expect(total).toBe('60000');
  });

  it('Volumétrico UPU gana — caja liviana a España', () => {
    // Peso físico: 1 kg, 40×30×30 cm, factor UPU 6000
    // vol = 40*30*30 / 6000 = 36000/6000 = 6 kg → volumétrico gana
    const intlResult = calcularPesoVolumetricoIntl(40, 30, 30, FACTOR_UPU, 30);
    const pesoPago   = calcularPesoFacturado(1, intlResult.pesoVol);

    expect(intlResult.valido).toBe(true);
    expect(intlResult.pesoVol).toBeCloseTo(6);
    expect(pesoPago).toBeCloseTo(6); // volumétrico gana

    // 6 kg excede el tramo ESP máx=5 → sin tarifa → error
    expect(() =>
      calcularTarifaInternacionalMs(TARIFAS_UPU, 'ESP', pesoPago),
    ).toThrow('No hay tarifa UPU');
  });

  it('Volumétrico dentro del límite — caja pequeña a USA', () => {
    // 10×10×10 cm, factor 6000 → vol = 1000/6000 ≈ 0.167 kg
    const intlResult = calcularPesoVolumetricoIntl(10, 10, 10, FACTOR_UPU, 30);
    const pesoPago   = calcularPesoFacturado(0.3, intlResult.pesoVol);

    expect(intlResult.valido).toBe(true);
    expect(intlResult.pesoVol).toBeCloseTo(0.167);
    expect(pesoPago).toBeCloseTo(0.3); // físico gana (0.3 > 0.167)

    const tarifa = calcularTarifaInternacionalMs(TARIFAS_UPU, 'USA', pesoPago);
    expect(tarifa).toBe('45000'); // cae en primer tramo USA
  });

  it('Excede peso máximo del proveedor — no válido', () => {
    // 150×100×100 cm, factor 6000 → vol = 250 kg, límite proveedor = 30 kg
    const intlResult = calcularPesoVolumetricoIntl(150, 100, 100, FACTOR_UPU, 30);

    expect(intlResult.valido).toBe(false);
    expect(intlResult.pesoVol).toBeCloseTo(250);
    expect(intlResult.pesoMaximoProveedor).toBe(30);
  });

  it('Estimado aduana USA: arancel 10%, TRM $4.200', () => {
    // Tarifa $90.000 COP → USD = 90000 / 4200 ≈ 21.43 USD
    // Aduana = 21.43 * 10/100 ≈ $2.14 USD
    const tarifa          = calcularTarifaInternacionalMs(TARIFAS_UPU, 'USA', 3);
    const { valorUsd }    = calcularConversionMoneda(tarifa, '4200');
    const aduanaEstimada  = calcularImpuestosAduanaDestino(valorUsd, '10');

    // Solo verificamos que el monto es positivo y razonable (informativo)
    expect(Number(aduanaEstimada)).toBeGreaterThan(0);
    expect(Number(aduanaEstimada)).toBeLessThan(50);
  });

  it('Valor declarado positivo pasa la validación', () => {
    // Un envío con valor declarado $500.000 es válido
    expect(() => validarValorDeclaradoIntl('500000')).not.toThrow();
  });

  it('Valor declarado cero lanza error — debe indicar el valor del contenido', () => {
    expect(() => validarValorDeclaradoIntl('0')).toThrow('mayor a cero');
  });

  it('País sin tarifa configurada lanza error — bloquea el envío', () => {
    expect(() =>
      calcularTarifaInternacionalMs(TARIFAS_UPU, 'CHN', 2),
    ).toThrow('No hay tarifa UPU');
  });
});
