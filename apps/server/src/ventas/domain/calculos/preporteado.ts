export function validarPreporteado(
  sumaEstampillas: string,
  valorServicio: string,
): void {
  if (Number(sumaEstampillas) !== Number(valorServicio)) {
    throw new Error(
      `Preporteado no corresponde: estampillas ${sumaEstampillas}, servicio ${valorServicio}. ` +
        'Deben ser exactamente iguales (sin diferencia aceptada).',
    );
  }
}
