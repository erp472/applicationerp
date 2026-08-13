export type EstadoVenta  = 'activa' | 'confirmada' | 'anulada';
export type MedioPagoVenta =
  | 'efectivo' | 'cheque' | 'tarjeta_debito' | 'tarjeta_credito'
  | 'transferencia' | 'consignacion' | 'preporteado' | 'mixto_preporteado';
export type TipoProducto = 'estampilla' | 'filatelia' | 'empaque' | 'material_oficina' | 'giro' | 'paquete' | 'otro';

export class VentaDetalleEntity {
  id:             number;
  ventaId:        number;
  productoId:     number;
  cantidad:       number;
  precioUnitario: number;
  descuento:      number;
  subtotal:       number;
  // populated on demand
  nombreProducto?: string;
  codigoProducto?: string;
  tipoProducto?:   TipoProducto;
  porcentajeTax?:  number;
}

export class VentaEntity {
  id:            number;
  sesionCajaId:  number;
  usuarioId:     number;
  clienteId:     number | null;
  subtotal:      number;
  descuento:     number;
  iva:           number;
  total:         number;
  medioPago:     MedioPagoVenta;
  estado:        EstadoVenta;
  emailFactura:  string | null;
  createdAt:     Date;
  updatedAt:     Date;
  // populated on demand
  detalle?:               VentaDetalleEntity[];
  envios?:                EnvioEntity[];
  apartadosPendientes?:   ApartadoPostalEntity[];
}

export class ClienteResumenEntity {
  id:              number;
  tipoDocumento:   string;
  numeroDocumento: string;
  nombre:          string;
  apellido:        string | null;
  email:           string | null;
  telefono:        string | null;
}

export class ProductoCatalogoEntity {
  id:            number;
  codigo:        string;
  nombre:        string;
  tipo:          TipoProducto;
  precio:        number;
  porcentajeTax: number;
  activo:        boolean;
  stockActual:    number | null;
  stockMinimo:    number | null;
  cantidadMinima: number | null;
  cantidadMaxima: number | null;
}

export type TamanoApartado = 'pequeno' | 'mediano' | 'grande';
export type EstadoApartado = 'disponible' | 'reservado' | 'ocupado' | 'vencido' | 'mantenimiento';

export class ApartadoPostalEntity {
  id:                    number;
  sucursalId:            number;
  numero:                string;
  tamano:                TamanoApartado;
  estado:                EstadoApartado;
  clienteId:             number | null;
  ventaId:               number | null;
  fechaInicio:           Date | null;
  fechaFin:              Date | null;
  valor:                 number | null;
  incluyeIva:            boolean;
  sesionCajaId:          number | null;
  diasAlertaVencimiento: number;
}

export interface ApartadoAdminItem extends ApartadoPostalEntity {
  sucursalNombre: string;
  sucursalCodigo: string;
}

export class ServicioCatalogoEntity {
  id:                    number;
  codigo:                string;
  nombre:                string;
  tipo:                  string;
  requiereEstampilla:    boolean;
  requiereDimensiones:   boolean;
  requiereValorDeclarado: boolean;
  pesoMaximoKg:          number | null;
  factorVolumetrico:     number;
  tiempoEntregaDias:     number | null;
  tarifaCertificacion:   number | null;
  minimoSeguroPostal:    number | null;
  altoMaxCm:             number | null;
  anchoMaxCm:            number | null;
  largoMaxCm:            number | null;
}

export class TarifaEnvioEntity {
  id:                 number;
  servicioId:         number;
  paisDestino:        string;
  ciudadDestino:      string | null;
  pesoMinKg:          number;
  pesoMaxKg:          number | null;
  tarifa:             number;
  tarifaKgAdicional:  number | null;
}

export interface ResumenLineaTurno {
  cantidad: number;
  total:    number;
}

export interface ResumenTurno {
  sesionCajaId:  number;
  sellos:        ResumenLineaTurno;
  productos:     ResumenLineaTurno;
  apartados:     ResumenLineaTurno;
  servicios:     ResumenLineaTurno;
  anulaciones:   ResumenLineaTurno;
  totalGeneral:  number;
}

export class TarifaEspecialEntity {
  id:          number;
  productoId:  number;
  minCantidad: number;
  maxCantidad: number | null;
  precio:      number;
}

export class DireccionFrecuenteEntity {
  id:          number;
  clienteId:   number;
  rol:         'remitente' | 'destinatario';
  nombre:      string;
  empresa:     string | null;
  telefono:    string | null;
  email:       string | null;
  direccion:   string | null;
  ciudad:      string | null;
  departamento: string | null;
  pais:        string;
  codigoPostal: string | null;
  documento:   string | null;
  usos:        number;
  ultimoUso:   Date;
}

export class EnvioEntity {
  id:                    number;
  ventaId:               number | null;
  numeroGuia:            string;
  tipo:                  string;
  sucursalId:            number;
  sesionCajaId:          number | null;
  usuarioId:             number;
  clienteId:             number | null;
  servicioId:            number;
  remitenteNombre:          string | null;
  remitenteDocumento:       string | null;
  remitenteTelefono:        string | null;
  remitenteEmail:           string | null;
  remitenteDireccion:       string | null;
  remitenteCiudad:          string | null;
  remitenteCodigoPostal:    string | null;
  destinatarioNombre:       string | null;
  destinatarioDocumento:    string | null;
  destinatarioTelefono:     string | null;
  destinatarioEmail:        string | null;
  destinatarioDireccion:    string | null;
  destinatarioCiudad:       string | null;
  destinatarioCodigoPostal: string | null;
  destinatarioPais:         string;
  pesoFisicoKg:          number;
  pesoVolumetricoKg:     number | null;
  pesoTarificadoKg:      number;
  altoCm:                number | null;
  anchoCm:               number | null;
  largoCm:               number | null;
  valorDeclarado:        number | null;
  valorServicio:         number;
  valorEstampillas:      number;
  valorSeguro:           number;
  valorCertificacion:    number;
  valorTotal:            number;
  medioPago:             MedioPagoVenta | null;
  estado:                string;
  createdAt:             Date;
}
