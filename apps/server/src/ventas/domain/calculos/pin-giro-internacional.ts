const LONGITUD_PIN: Record<string, number> = {
  moneygram: 6,
  ria: 11,
  ifs: 6,
};

export interface DatosGiro {
  pin: string;
  nombreBeneficiario: string;
  cedulaBeneficiario: string;
  fechaNacimiento: string;
}

export function validarPinGiroInternacional(
  pin: string,
  operador: string,
  nombreBeneficiario: string,
  cedulaBeneficiario: string,
  fechaNacimiento: string,
  datosGiro: DatosGiro,
): void {
  const longitud = LONGITUD_PIN[operador];
  if (longitud === undefined) throw new Error(`Operador desconocido: ${operador}`);
  if (pin.length !== longitud || !/^\d+$/.test(pin)) {
    throw new Error(`PIN inválido para ${operador}: debe tener ${longitud} dígitos numéricos`);
  }
  if (pin !== datosGiro.pin) throw new Error('PIN incorrecto');
  if (nombreBeneficiario.trim().toLowerCase() !== datosGiro.nombreBeneficiario.toLowerCase()) {
    throw new Error('Nombre del beneficiario no coincide');
  }
  if (cedulaBeneficiario !== datosGiro.cedulaBeneficiario) {
    throw new Error('Cédula del beneficiario no coincide');
  }
  if (fechaNacimiento !== datosGiro.fechaNacimiento) {
    throw new Error('Fecha de nacimiento del beneficiario no coincide');
  }
}
