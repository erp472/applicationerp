import {
  ServicioCodigoDuplicadoError,
  ServicioFactorVolumetricoRequeridoError,
  ServicioPesoExcedidoError,
  ServicioCampoNegativoError,
  ServicioEstampillaInconsistenteError,
} from './servicio.errors.js';

// BR-SRV-001
export function validateCodigoNotDuplicated(codigo: string, exists: boolean): void {
  if (exists) throw new ServicioCodigoDuplicadoError(codigo);
}

// BR-SRV-002
export function validateRequiereDimensiones(
  requiereDimensiones: boolean,
  factorVolumetrico: number | null,
): void {
  if (requiereDimensiones && factorVolumetrico === null) {
    throw new ServicioFactorVolumetricoRequeridoError();
  }
}

// BR-SRV-003 (#POC-ENV-001)
export function calcularPesoVolumetrico(
  alto: number,
  ancho: number,
  largo: number,
  factorVolumetrico: number,
): number {
  return Math.round(((alto * ancho * largo) / factorVolumetrico) * 1000) / 1000;
}

// BR-SRV-004 (#POC-ENV-001)
export function calcularPesoTarificado(pesoFisico: number, pesoVolumetrico: number): number {
  return Math.max(pesoFisico, pesoVolumetrico);
}

// BR-SRV-005
export function validatePesoMaximo(
  pesoTarificado: number,
  pesoMaximoKg: number | null,
): void {
  if (pesoMaximoKg !== null && pesoTarificado > pesoMaximoKg) {
    throw new ServicioPesoExcedidoError(pesoTarificado, pesoMaximoKg);
  }
}

// BR-SRV-006
export function validateCamposPositivos(
  tiempoEntrega: number | null,
  pesoMaximo: number | null,
): void {
  if (tiempoEntrega !== null && tiempoEntrega <= 0) throw new ServicioCampoNegativoError('tiempo_entrega_dias');
  if (pesoMaximo    !== null && pesoMaximo    <= 0) throw new ServicioCampoNegativoError('peso_maximo_kg');
}

// BR-SRV-007 (#POC-ENV-004)
export function validateEstampillaConsistency(
  requiereEstampilla: boolean,
  tipoServicio: string,
): void {
  if (requiereEstampilla && tipoServicio !== 'nacional') {
    throw new ServicioEstampillaInconsistenteError();
  }
}
