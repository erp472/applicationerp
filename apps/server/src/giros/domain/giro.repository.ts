import type { GiroEntity, TipoGiro } from './giro.entity.js';

export const GIROS_REPOSITORY = Symbol('GIROS_REPOSITORY');

export interface ICrearGiroNacionalData {
  sucursalId:             number;
  sesionCajaId:           number;
  usuarioId:              number;
  clienteRemitenteId?:    number;

  remitenteTipoDoc?:      string;
  remitenteNumeroDoc?:    string;
  remitenteNombre?:       string;
  remitenteFechaExpDoc?:  Date;
  remitenteCiudad?:       string;
  remitenteDireccion?:    string;
  remitenteEmail?:        string;
  remitenteHuella?:       boolean;

  beneficiarioTipoDoc?:   string;
  beneficiarioNumeroDoc?: string;
  beneficiarioNombre?:    string;
  beneficiarioCiudad?:    string;
  beneficiarioDireccion?: string;
  beneficiarioTelefono?:  string;
  beneficiarioMensaje?:   string;
  beneficiarioHuella?:    boolean;
  beneficiarioPep?:       boolean;

  montoCop:               string;
  fleteCop:               string;
  fleteAsumidoPor?:       'remitente' | 'beneficiario';
  montoTotalCop:          string;
  pin:                    string;
}

export interface ICrearGiroInternacionalData {
  sucursalId:             number;
  sesionCajaId:           number;
  usuarioId:              number;
  tipo:                   TipoGiro;

  remitenteTipoDoc?:      string;
  remitenteNumeroDoc?:    string;
  remitenteNombre?:       string;
  remitenteCiudad?:       string;
  remitenteEmail?:        string;
  remitenteHuella?:       boolean;

  beneficiarioTipoDoc?:   string;
  beneficiarioNumeroDoc?: string;
  beneficiarioNombre?:    string;
  beneficiarioFechaNac?:  Date;
  beneficiarioPais?:      string;
  beneficiarioEstado?:    string;
  beneficiarioCiudad?:    string;
  beneficiarioDireccion?: string;
  beneficiarioTelefono?:  string;
  beneficiarioHuella?:    boolean;
  beneficiarioPep?:       boolean;
  beneficiarioSospechoso?: boolean;

  montoCop:               string;
  montoTotalCop:          string;
  montoDestino?:          string;
  monedaDestino?:         string;
  tasaCambio?:            string;
  pin?:                   string;
  numeroReferencia?:      string;
}

export interface IPagarGiroData {
  nombreBeneficiario:    string;
  numeroDocBeneficiario: string;
}

export interface IGirosRepository {
  crearGiroNacional(data: ICrearGiroNacionalData): Promise<GiroEntity>;
  crearGiroInternacional(data: ICrearGiroInternacionalData): Promise<GiroEntity>;
  findGiroById(id: number): Promise<GiroEntity | null>;
  findGirosByPinYSucursal(pin: string, sucursalId?: number): Promise<GiroEntity[]>;
  findGirosBySesion(sesionId: number): Promise<GiroEntity[]>;
  pagarGiro(id: number): Promise<GiroEntity>;
  anularGiro(id: number): Promise<GiroEntity>;
  findPinsExistentes(): Promise<Set<string>>;
  findTablasFletes(tipo: TipoGiro): Promise<{ valorMin: string; valorMax: string; flete: string }[]>;
}
