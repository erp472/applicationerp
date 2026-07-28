export function validarPesoMaximo(
  pesoTarificado: number,
  pesoMaximoKg: number | null | undefined,
): void {
  if (pesoMaximoKg === null || pesoMaximoKg === undefined) return;
  if (pesoTarificado > pesoMaximoKg) {
    throw new Error(
      `El peso ${pesoTarificado} kg supera el máximo permitido por el servicio: ${pesoMaximoKg} kg`,
    );
  }
}
