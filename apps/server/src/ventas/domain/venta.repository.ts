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
  DireccionFrecuenteEntity,
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

export interface UpdateVentaTotalesData {
  medioPago:  MedioPagoVenta;
  subtotal:   number;
  descuento:  number;
  iva:        number;
  total:      number;
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

export interface ReservarApartadoData {
  apartadoId:   number;
  tamano:       TamanoApartado;
  clienteId:    number;
  ventaId:      number;
  sesionCajaId: number;
  fechaInicio:  Date;
  fechaFin:     Date;
  monto:        number;
  incluyeIva:   boolean;
}

export interface FinalizarApartadoData {
  sesionCajaId: number;
}

export interface CrearEnvioData {
  ventaId?:             number;
  sucursalId:           number;
  sesionCajaId:         number;
  usuarioId:            number;
  clienteId?:           number;
  servicioId:           number;
  tipo:                 string;
  numeroGuia:           string;
  estado?:              'pendiente' | 'facturado';
  remitenteNombre:      string;
  remitenteDocumento?:  string;
  remitenteEmail?:      string;
  remitenteTelefono?:   string;
  remitenteDireccion?:  string;
  remitenteCiudad?:         string;
  remitenteDepartamento?:   string;
  remitenteCp?:             string;
  destinatarioNombre:       string;
  destinatarioDocumento?:   string;
  destinatarioEmail?:       string;
  destinatarioTelefono?:    string;
  destinatarioDireccion?:   string;
  destinatarioCiudad?:      string;
  destinatarioDepartamento?: string;
  destinatarioPais:         string;
  destinatarioCp?:          string;
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
  valorCertificacion:   number;
  valorTotal:           number;
  medioPago:            MedioPagoVenta;
  contenido?:           string;
  observaciones?:       string;
  esCorrespondencia?:   boolean;
}

export interface IVentasRepository {
  // Clientes
  findClienteByDocumento(tipo: string, numero: string): Promise<ClienteResumenEntity | null>;
  findClienteById(clienteId: number): Promise<ClienteResumenEntity | null>;
  acumularSaldoAFavor(clienteId: number, monto: number): Promise<void>;
  deducirSaldoAFavor(clienteId: number, monto: number): Promise<void>;

  // Catálogo productos
  findProductosBySucursal(sucursalId: number, tipo?: TipoProducto): Promise<ProductoCatalogoEntity[]>;
  findProductoById(productoId: number, sucursalId?: number): Promise<ProductoCatalogoEntity | null>;

  // Ventas
  crearVenta(data: CrearVentaData): Promise<VentaEntity>;
  findVentaById(id: number): Promise<VentaEntity | null>;
  findVentaConDetalle(id: number): Promise<VentaEntity | null>;
  updateVentaTotales(id: number, data: UpdateVentaTotalesData): Promise<void>;
  confirmarVenta(id: number, data: ConfirmarVentaData): Promise<VentaEntity>;
  anularVenta(id: number): Promise<VentaEntity>;
  listVentasBySession(sesionCajaId: number, fecha?: Date): Promise<VentaEntity[]>;
  findVentasBySucursalHoy(sucursalId: number): Promise<VentaEntity[]>;

  // Detalle (carrito)
  agregarDetalle(data: AgregarDetalleData): Promise<VentaDetalleEntity>;
  eliminarDetalle(detalleId: number): Promise<void>;
  findDetalleById(detalleId: number): Promise<VentaDetalleEntity | null>;

  // Apartado Postal — operativo
  findApartadosDisponibles(sucursalId: number, tamano?: TamanoApartado): Promise<ApartadoPostalEntity[]>;
  findApartadosPorSucursal(sucursalId: number, tamano?: TamanoApartado): Promise<ApartadoPostalEntity[]>;
  findApartadoByNumero(sucursalId: number, numero: string): Promise<ApartadoPostalEntity | null>;
  contratarApartado(data: ContratarApartadoData): Promise<ApartadoPostalEntity>;
  reservarApartado(data: ReservarApartadoData): Promise<ApartadoPostalEntity>;
  liberarApartado(id: number): Promise<ApartadoPostalEntity>;
  liberarApartadoReservado(id: number): Promise<ApartadoPostalEntity>;
  finalizarApartadoReservado(id: number): Promise<ApartadoPostalEntity>;
  findApartadosPendientesByVenta(ventaId: number): Promise<ApartadoPostalEntity[]>;
  renovarApartado(id: number, data: { nuevaFechaFin: Date; monto: number; sesionCajaId: number }): Promise<ApartadoPostalEntity>;

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
  findTarifasEnvioByPais(servicioId: number, paisDestino: string): Promise<TarifaEnvioEntity[]>;
  findPaisesDestinoByServicio(servicioId: number): Promise<string[]>;
  findEstampillasConStock(sucursalId: number): Promise<{ denominacion: string; stock: number; serie: string | null }[]>;
  crearEnvio(data: CrearEnvioData): Promise<EnvioEntity>;
  anularEnvio(id: number): Promise<EnvioEntity>;
  findEnvioById(id: number): Promise<EnvioEntity | null>;
  findEnviosPendientesByVenta(ventaId: number): Promise<EnvioEntity[]>;
  facturarEnvio(id: number): Promise<EnvioEntity>;

  // Tarifas servicios especiales (por rango de cantidad)
  findTarifasEspecial(productoId: number): Promise<TarifaEspecialEntity[]>;
  setTarifasEspecial(productoId: number, tarifas: Array<{ minCantidad: number; maxCantidad: number | null; precio: number }>): Promise<TarifaEspecialEntity[]>;

  // Resumen de turno
  getResumenSesion(sesionCajaId: number): Promise<ResumenTurno>;

  // Consecutivo para número de guía (MAX id de envios + 1)
  nextConsecutivoGuia(): Promise<number>;

  // Direcciones frecuentes
  upsertDireccionFrecuente(data: {
    clienteId:   number;
    rol:         'remitente' | 'destinatario';
    nombre:      string;
    empresa?:    string;
    telefono?:   string;
    email?:      string;
    direccion?:  string;
    ciudad?:     string;
    departamento?: string;
    pais:        string;
    codigoPostal?: string;
    documento?:  string;
  }): Promise<void>;

  findDireccionesFrecuentes(
    clienteId: number,
    rol?: 'remitente' | 'destinatario',
  ): Promise<DireccionFrecuenteEntity[]>;

  findDireccionesPorDocumento(
    documento: string,
    rol?: 'remitente' | 'destinatario',
  ): Promise<DireccionFrecuenteEntity[]>;
}
