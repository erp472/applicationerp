import type { ClienteEntity, TipoClienteEntity } from '../domain/cliente.entity.js';

export class ClientesPresenter {
  static toTipo(e: TipoClienteEntity) {
    return {
      id:                  e.id,
      codigo:              e.codigo,
      nombre:              e.nombre,
      descuentoPorcentaje: e.descuentoPorcentaje,
      aplicaEstampillas:   e.aplicaEstampillas,
      aplicaGirosSisben:   e.aplicaGirosSisben,
      activo:              e.activo,
      vigenciaInicio:      e.vigenciaInicio?.toISOString().split('T')[0] ?? null,
      vigenciaFin:         e.vigenciaFin?.toISOString().split('T')[0]   ?? null,
      createdAt:           e.createdAt.toISOString(),
    };
  }

  static toCliente(e: ClienteEntity) {
    return {
      id:              e.id,
      tipoDocumento:   e.tipoDocumento,
      numeroDocumento: e.numeroDocumento,
      nombre:          e.nombre,
      apellido:        e.apellido,
      nombreCompleto:  [e.nombre, e.apellido].filter(Boolean).join(' '),
      email:           e.email,
      telefono:        e.telefono,
      direccion:       e.direccion,
      ciudad:          e.ciudad,
      codigoPostal:    e.codigoPostal,
      tipoClienteId:   e.tipoClienteId,
      tipoCliente:     e.tipoCliente ? ClientesPresenter.toTipo(e.tipoCliente) : null,
      canal:           e.tipoCliente ? e.tipoCliente.codigo : 'retail',
      nivelSisben:     e.nivelSisben,
      enviosSisbenAno: e.enviosSisbenAno,
      activo:          e.activo,
      createdAt:       e.createdAt.toISOString(),
      updatedAt:       e.updatedAt.toISOString(),
    };
  }
}
