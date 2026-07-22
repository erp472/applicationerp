export type EstadoVenta  = 'activa' | 'anulada';
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
  tipoProducto?:   TipoProducto;
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
  detalle?:      VentaDetalleEntity[];
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
export type EstadoApartado = 'disponible' | 'ocupado' | 'vencido' | 'mantenimiento';

export class ApartadoPostalEntity {
  id:              number;
  sucursalId:      number;
  numero:          string;
  tamano:          TamanoApartado;
  estado:          EstadoApartado;
  clienteId:       number | null;
  fechaInicio:     Date | null;
  fechaFin:        Date | null;
  valor:           number | null;
  incluyeIva:      boolean;
  sesionCajaId:    number | null;
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

export class EnvioEntity {
  id:                   number;
  numeroGuia:           string;
  tipo:                 string;
  sucursalId:           number;
  sesionCajaId:         number | null;
  usuarioId:            number;
  clienteId:            number | null;
  servicioId:           number;
  remitenteNombre:      string | null;
  remitenteDocumento:   string | null;
  remitenteTelefono:    string | null;
  remitenteDireccion:   string | null;
  remitenteCiudad:      string | null;
  destinatarioNombre:   string | null;
  destinatarioDocumento: string | null;
  destinatarioDireccion: string | null;
  destinatarioCiudad:   string | null;
  destinatarioPais:     string;
  pesoFisicoKg:         number;
  pesoVolumetricoKg:    number | null;
  pesoTarificadoKg:     number;
  altoCm:               number | null;
  anchoCm:              number | null;
  largoCm:              number | null;
  valorDeclarado:       number | null;
  valorServicio:        number;
  valorEstampillas:     number;
  valorSeguro:          number;
  valorTotal:           number;
  medioPago:            MedioPagoVenta | null;
  estado:               string;
  createdAt:            Date;
}
