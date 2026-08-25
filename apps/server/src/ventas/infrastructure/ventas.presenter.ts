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
      detalle:               entity.detalle?.map(VentasPresenter.toDetalle) ?? [],
      enviosPendientes:      entity.envios?.map(VentasPresenter.toEnvio) ?? [],
      apartadosPendientes:   entity.apartadosPendientes?.map(VentasPresenter.toApartado) ?? [],
    };
  }

  static toDetalle(entity: VentaDetalleEntity) {
    return {
      id:             entity.id,
      productoId:     entity.productoId,
      nombreProducto: entity.nombreProducto  ?? null,
      codigoProducto: entity.codigoProducto  ?? null,
      tipoProducto:   entity.tipoProducto    ?? null,
      cantidad:       entity.cantidad,
      precioUnitario: entity.precioUnitario,
      descuento:      entity.descuento,
      subtotal:       entity.subtotal,
      porcentajeTax:  entity.porcentajeTax   ?? 0,
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
      saldoAFavor:     entity.saldoAFavor,
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
      stockActual:    entity.stockActual,
      stockMinimo:    entity.stockMinimo,
      cantidadMinima: entity.cantidadMinima,
      cantidadMaxima: entity.cantidadMaxima,
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
      ventaId:      entity.ventaId,
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
      valorSeguro:          entity.valorSeguro,
      valorEstampillas:     entity.valorEstampillas,
      valorCertificacion:   entity.valorCertificacion,
      valorTotal:           entity.valorTotal,
      estado:               entity.estado,
      createdAt:            entity.createdAt.toISOString(),
    };
  }

  static toGuia(entity: EnvioEntity, servicioNombre?: string, fechaEntregaEstimada?: string | null) {
    const esInternacional = entity.tipo.startsWith('internacional');
    return {
      numeroGuia:   entity.numeroGuia,
      codigoBarras: entity.numeroGuia,
      tipo:         esInternacional ? 'internacional' : 'nacional',
      tipoServicio: servicioNombre ?? entity.tipo,
      remitente: {
        nombre:       entity.remitenteNombre,
        documento:    entity.remitenteDocumento,
        telefono:     entity.remitenteTelefono,
        email:        entity.remitenteEmail,
        direccion:    entity.remitenteDireccion,
        ciudad:       entity.remitenteCiudad,
        departamento: entity.remitenteDepartamento,
        codigoPostal: entity.remitenteCodigoPostal,
        pais:         'CO',
      },
      destinatario: {
        nombre:       entity.destinatarioNombre,
        documento:    entity.destinatarioDocumento,
        telefono:     entity.destinatarioTelefono,
        email:        entity.destinatarioEmail,
        direccion:    entity.destinatarioDireccion,
        ciudad:       entity.destinatarioCiudad,
        departamento: entity.destinatarioDepartamento,
        codigoPostal: entity.destinatarioCodigoPostal,
        pais:         entity.destinatarioPais,
      },
      peso: {
        fisicoKg:      entity.pesoFisicoKg,
        tarificadoKg:  entity.pesoTarificadoKg,
        altoCm:        entity.altoCm,
        anchoCm:       entity.anchoCm,
        largoCm:       entity.largoCm,
        volumetricoKg: entity.pesoVolumetricoKg,
      },
      valores: {
        servicio:   entity.valorServicio,
        manejo:     entity.valorCertificacion,
        seguro:     entity.valorSeguro,
        declarado:  entity.valorDeclarado,
        total:      entity.valorTotal,
      },
      estado:               entity.estado,
      generadoEn:           entity.createdAt.toISOString(),
      ordenServicio:        entity.id,
      fechaEntregaEstimada: fechaEntregaEstimada ?? null,
      centroOperativo:      null,
    };
  }
}
