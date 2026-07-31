export type EstadoRecaudo = 'exitoso' | 'fallido' | 'anulado';

export class ConvenioEntity {
  id:          number;
  codigo:      string;
  nombre:      string;
  descripcion: string | null;
  activo:      boolean;
}

export class RecaudoEntity {
  id:             number;
  convenioId:     number;
  sucursalId:     number;
  sesionCajaId:   number | null;
  usuarioId:      number;
  clienteId:      number | null;
  referenciaPago: string;
  codigoBarras:   string | null;
  monto:          number;
  estado:         EstadoRecaudo;
  createdAt:      Date;
}
