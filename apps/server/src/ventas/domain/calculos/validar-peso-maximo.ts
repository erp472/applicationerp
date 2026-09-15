import { PesoExcedeLimiteError } from '../venta.errors.js';

export function validarPesoMaximo(
  pesoTarificado: number,
  pesoMaximoKg: number | null | undefined,
): void {
  if (pesoMaximoKg === null || pesoMaximoKg === undefined) return;
  if (pesoTarificado > pesoMaximoKg) {
    throw new PesoExcedeLimiteError(pesoTarificado, pesoMaximoKg);
  }
}
