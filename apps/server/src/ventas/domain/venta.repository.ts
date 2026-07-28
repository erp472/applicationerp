import type {
  VentaEntity,
  VentaDetalleEntity,
  ClienteResumenEntity,
  ProductoCatalogoEntity,
  ApartadoPostalEntity,
  ApartadoAdminItem,
  ServicioCatalogoEntity,
  TarifaEnvioEntity,
  TarifaEspecialEntity,
  EnvioEntity,
  ResumenTurno,
  MedioPagoVenta,
  TipoProducto,
  TamanoApartado,
  EstadoApartado,
} from './venta.entity.js';

export const VENTAS_REPOSITORY = Symbol('VENTAS_REPOSITORY');

export interface CrearVentaData {
  sesionCajaId: number;
  usuarioId:    number;
  clienteId?:   number;
}

export interface AgregarDetalleData {
  ventaId:        number;
  productoId:     number;
  cantidad:       number;
  precioUnitario: number;
  descuento:      number;
}

export interface ConfirmarVentaData {
  medioPago:        MedioPagoVenta;
  efectivoRecibido?: number;
  emailFactura?:     string;
}

export interface ContratarApartadoData {
  sucursalId:   number;
  numero:       string;
  tamano:       TamanoApartado;
  clienteId:    number;
  sesionCajaId: number;
  fechaInicio:  Date;
  fechaFin:     Date;
  monto:        number;
  incluyeIva:   boolean;
}

export interface CrearEnvioData {
  sucursalId:           number;
  sesionCajaId:         number;
  usuarioId:            number;
  clienteId?:           number;
  servicioId:           number;
  tipo:                 string;
  numeroGuia:           string;
  remitenteNombre:      string;
  remitenteDocumento?:  string;
  remitenteEmail?:      string;
  remitenteTelefono?:   string;
  remitenteDireccion?:  string;
  remitenteCiudad?:     string;
  remitenteCp?:         string;
  destinatarioNombre:   string;
  destinatarioDocumento?: string;
  destinatarioEmail?:   string;
  destinatarioTelefono?: string;
  destinatarioDireccion?: string;
  destinatarioCiudad?:  string;
  destinatarioPais:     string;
  destinatarioCp?:      string;
  pesoFisicoKg:         number;
  altoCm?:              number;
  anchoCm?:             number;
  largoCm?:             number;
  pesoVolumetricoKg?:   number;
  pesoTarificadoKg:     number;
  valorDeclarado?:      number;
  valorServicio:        number;
  valorEstampillas:     number;
  valorSeguro:          number;
  valorTotal:           number;
  medioPago:            MedioPagoVenta;
  contenido?:           string;
  observaciones?:       string;
}

export interface IVentasRepository {
  // Clientes
  findClienteByDocumento(tipo: string, numero: string): Promise<ClienteResumenEntity | null>;

  // Catálogo productos
  findProductosBySucursal(sucursalId: number, tipo?: TipoProducto): Promise<ProductoCatalogoEntity[]>;
  findProductoById(productoId: number, sucursalId?: number): Promise<ProductoCatalogoEntity | null>;

  // Ventas
  crearVenta(data: CrearVentaData): Promise<VentaEntity>;
  findVentaById(id: number): Promise<VentaEntity | null>;
  findVentaConDetalle(id: number): Promise<VentaEntity | null>;
  confirmarVenta(id: number, data: ConfirmarVentaData): Promise<VentaEntity>;
  anularVenta(id: number): Promise<VentaEntity>;
  listVentasBySession(sesionCajaId: number, fecha?: Date): Promise<VentaEntity[]>;

  // Detalle (carrito)
  agregarDetalle(data: AgregarDetalleData): Promise<VentaDetalleEntity>;
  eliminarDetalle(detalleId: number): Promise<void>;
  findDetalleById(detalleId: number): Promise<VentaDetalleEntity | null>;

  // Apartado Postal — operativo
  findApartadosDisponibles(sucursalId: number, tamano?: TamanoApartado): Promise<ApartadoPostalEntity[]>;
  findApartadoByNumero(sucursalId: number, numero: string): Promise<ApartadoPostalEntity | null>;
  contratarApartado(data: ContratarApartadoData): Promise<ApartadoPostalEntity>;
  liberarApartado(id: number): Promise<ApartadoPostalEntity>;

  // Apartado Postal — admin CRUD
  findAllApartadosAdmin(filters: { sucursalId?: number; estado?: string; tamano?: string }): Promise<ApartadoAdminItem[]>;
  findApartadoById(id: number): Promise<ApartadoPostalEntity | null>;
  createApartado(data: { sucursalId: number; numero: string; tamano: TamanoApartado; diasAlertaVencimiento: number }): Promise<ApartadoPostalEntity>;
  updateApartadoAdmin(id: number, data: { tamano?: TamanoApartado; estado?: EstadoApartado; diasAlertaVencimiento?: number }): Promise<ApartadoPostalEntity>;
  deleteApartado(id: number): Promise<void>;

  // Servicios Postales
  findServiciosBySucursal(sucursalId: number): Promise<ServicioCatalogoEntity[]>;
  findServicioById(servicioId: number): Promise<ServicioCatalogoEntity | null>;
  findTarifaEnvio(servicioId: number, pesoKg: number, paisDestino: string, ciudadDestino?: string): Promise<TarifaEnvioEntity | null>;
  crearEnvio(data: CrearEnvioData): Promise<EnvioEntity>;
  anularEnvio(id: number): Promise<EnvioEntity>;

  // Tarifas servicios especiales (por rango de cantidad)
  findTarifasEspecial(productoId: number): Promise<TarifaEspecialEntity[]>;

  // Inventario servicios especiales
  getStockActual(productoId: number, sucursalId: number): Promise<number | null>;
  descontarInventario(params: {
    productoId:   number;
    sucursalId:   number;
    cantidad:     number;
    ventaId:      number;
    usuarioId:    number;
  }): Promise<void>;
  restaurarInventario(params: {
    productoId:   number;
    sucursalId:   number;
    cantidad:     number;
    ventaId:      number;
    usuarioId:    number;
  }): Promise<void>;

  // Resumen de turno
  getResumenSesion(sesionCajaId: number): Promise<ResumenTurno>;
}
