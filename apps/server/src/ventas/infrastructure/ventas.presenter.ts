import type {
  VentaEntity,
  VentaDetalleEntity,
  ClienteResumenEntity,
  ProductoCatalogoEntity,
  ApartadoPostalEntity,
  ServicioCatalogoEntity,
  EnvioEntity,
} from '../domain/venta.entity.js';

export class VentasPresenter {
  static toVenta(entity: VentaEntity) {
    return {
      id:           entity.id,
      sesionCajaId: entity.sesionCajaId,
      clienteId:    entity.clienteId,
      subtotal:     entity.subtotal,
      descuento:    entity.descuento,
      iva:          entity.iva,
      total:        entity.total,
      medioPago:    entity.medioPago,
      estado:       entity.estado,
      createdAt:    entity.createdAt.toISOString(),
      detalle:      entity.detalle?.map(VentasPresenter.toDetalle) ?? [],
    };
  }

  static toDetalle(entity: VentaDetalleEntity) {
    return {
      id:             entity.id,
      productoId:     entity.productoId,
      nombreProducto: entity.nombreProducto ?? null,
      tipoProducto:   entity.tipoProducto   ?? null,
      cantidad:       entity.cantidad,
      precioUnitario: entity.precioUnitario,
      descuento:      entity.descuento,
      subtotal:       entity.subtotal,
    };
  }

  static toCliente(entity: ClienteResumenEntity) {
    return {
      id:              entity.id,
      tipoDocumento:   entity.tipoDocumento,
      numeroDocumento: entity.numeroDocumento,
      nombre:          entity.nombre,
      apellido:        entity.apellido,
      email:           entity.email,
      telefono:        entity.telefono,
    };
  }

  static toProducto(entity: ProductoCatalogoEntity) {
    return {
      id:            entity.id,
      codigo:        entity.codigo,
      nombre:        entity.nombre,
      tipo:          entity.tipo,
      precio:        entity.precio,
      porcentajeTax: entity.porcentajeTax,
      stockActual:   entity.stockActual,
      stockMinimo:   entity.stockMinimo,
    };
  }

  static toApartado(entity: ApartadoPostalEntity) {
    return {
      id:           entity.id,
      sucursalId:   entity.sucursalId,
      numero:       entity.numero,
      tamano:       entity.tamano,
      estado:       entity.estado,
      clienteId:    entity.clienteId,
      fechaInicio:  entity.fechaInicio?.toISOString().slice(0, 10) ?? null,
      fechaFin:     entity.fechaFin?.toISOString().slice(0, 10) ?? null,
      valor:        entity.valor,
      incluyeIva:   entity.incluyeIva,
    };
  }

  static toServicio(entity: ServicioCatalogoEntity) {
    return {
      id:                    entity.id,
      codigo:                entity.codigo,
      nombre:                entity.nombre,
      tipo:                  entity.tipo,
      requiereEstampilla:    entity.requiereEstampilla,
      requiereDimensiones:   entity.requiereDimensiones,
      requiereValorDeclarado: entity.requiereValorDeclarado,
      pesoMaximoKg:          entity.pesoMaximoKg,
      tiempoEntregaDias:     entity.tiempoEntregaDias,
    };
  }

  static toEnvio(entity: EnvioEntity) {
    return {
      id:                   entity.id,
      numeroGuia:           entity.numeroGuia,
      tipo:                 entity.tipo,
      remitenteNombre:      entity.remitenteNombre,
      destinatarioNombre:   entity.destinatarioNombre,
      destinatarioCiudad:   entity.destinatarioCiudad,
      destinatarioPais:     entity.destinatarioPais,
      pesoFisicoKg:         entity.pesoFisicoKg,
      pesoTarificadoKg:     entity.pesoTarificadoKg,
      valorServicio:        entity.valorServicio,
      valorTotal:           entity.valorTotal,
      estado:               entity.estado,
      createdAt:            entity.createdAt.toISOString(),
    };
  }
}
