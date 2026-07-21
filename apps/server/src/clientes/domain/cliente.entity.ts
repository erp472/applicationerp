export type TipoDocumento = 'cedula' | 'pasaporte' | 'tarjeta_identidad' | 'cedula_extranjeria' | 'nit';

export class TipoClienteEntity {
  id: number;
  codigo: string;
  nombre: string;
  descuentoPorcentaje: string;
  aplicaEstampillas: boolean;
  aplicaGirosSisben: boolean;
  activo: boolean;
  vigenciaInicio: Date | null;
  vigenciaFin: Date | null;
  createdAt: Date;
}

export class ClienteEntity {
  id: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  codigoPostal: string | null;
  tipoClienteId: number | null;
  nivelSisben: number | null;
  enviosSisbenAno: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  // populated on demand
  tipoCliente?: TipoClienteEntity | null;
}
