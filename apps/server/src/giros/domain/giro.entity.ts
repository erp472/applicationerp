export type TipoGiro = 'nacional' | 'moneygram' | 'ria' | 'ifs';
export type OperacionGiro = 'emision' | 'pago';
export type EstadoGiro = 'pendiente' | 'aprobado' | 'pagado' | 'anulado' | 'rechazado';
export type FleteAsumidoPor = 'remitente' | 'beneficiario';
export type ResultadoInspektor = 'limpio' | 'alerta' | 'bloqueado';

export class GiroEntity {
  id:                        number;
  tipo:                      TipoGiro;
  operacion:                 OperacionGiro;
  sucursalId:                number;
  sesionCajaId:              number | null;
  usuarioId:                 number;
  clienteRemitenteId:        number | null;

  remitenteTipoDoc:          string | null;
  remitenteNumeroDoc:        string | null;
  remitenteNombre:           string | null;
  remitenteFechaExpDoc:      Date | null;
  remitenteCiudad:           string | null;
  remitenteDireccion:        string | null;
  remitenteEmail:            string | null;
  remitenteHuella:           boolean;

  beneficiarioHuella:        boolean;
  beneficiarioPep:           boolean;
  beneficiarioSospechoso:    boolean;
  beneficiarioTipoDoc:       string | null;
  beneficiarioNumeroDoc:     string | null;
  beneficiarioNombre:        string | null;
  beneficiarioFechaNac:      Date | null;
  beneficiarioPais:          string;
  beneficiarioEstado:        string | null;
  beneficiarioCiudad:        string | null;
  sucursalBeneficiarioId:    number | null;
  beneficiarioDireccion:     string | null;
  beneficiarioTelefono:      string | null;
  beneficiarioMensaje:       string | null;

  montoCop:                  number;
  fleteCop:                  number;
  fleteAsumidoPor:           FleteAsumidoPor | null;
  montoTotalCop:             number;
  montoDestino:              number | null;
  monedaDestino:             string;
  tasaCambio:                number | null;

  pin:                       string | null;
  numeroReferencia:          string | null;
  referenciaProveedor:       string | null;

  consultaInspektor:         boolean;
  resultadoInspektor:        ResultadoInspektor | null;
  inspektorReferencia:       string | null;

  estado:                    EstadoGiro;
  formulario5:               boolean;
  declaracionOrigen:         boolean;
  fotocopiaCedula:           boolean;
  reportadoMintic:           boolean;

  createdAt:                 Date;
  updatedAt:                 Date;
}
