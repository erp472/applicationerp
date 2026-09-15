export class EnviosMasivosPresenter {
  static toLote(lote: any) {
    return {
      id:            lote.idenvios_masivos,
      estado:        lote.estadoenvios_masivos,
      sucursalId:    lote.sucursales_idsucursales,
      servicioId:    lote.servicios_idservicios,
      servicio:      lote.servicio ?? undefined,
      clienteId:     lote.clientes_idclientes,
      // null = lote multi-origen (remitente por item)
      remitente: lote.remitente_nombreenvios_masivos ? {
        nombre:       lote.remitente_nombreenvios_masivos,
        documento:    lote.remitente_documentoenvios_masivos,
        email:        lote.remitente_emailenvios_masivos,
        telefono:     lote.remitente_telefonoenvios_masivos,
        direccion:    lote.remitente_direccionenvios_masivos,
        ciudad:       lote.remitente_ciudadenvios_masivos,
        codigoPostal: lote.remitente_cpenvios_masivos,
      } : null,
      totales: {
        items:          lote.total_itemsenvios_masivos,
        pesoKg:         Number(lote.total_peso_kgenvios_masivos),
        estampillas:    Number(lote.total_estampillasenvios_masivos),
        certificacion:  Number(lote.total_certificacionenvios_masivos ?? 0),
        total:          Number(lote.valor_totalenvios_masivos),
      },
      observaciones:  lote.observacionesenvios_masivos,
      pdfGenerado:    lote.pdf_guias_pathenvios_masivos != null,
      cobrado:        lote.cobrado_atenvios_masivos != null,
      medioPagoCobro: lote.medio_pago_cobroenvios_masivos ?? null,
      cobradoAt:      lote.cobrado_atenvios_masivos ?? null,
      createdAt:      lote.created_atenvios_masivos,
      updatedAt:      lote.updated_atenvios_masivos,
      items:          lote.items?.map(EnviosMasivosPresenter.toItem),
    };
  }

  static toItem(item: any) {
    return {
      id:          item.idenvios_masivos_items,
      fila:        item.numero_filaenvios_masivos_items,
      envioId:     item.envios_idenvios,
      // null mientras el lote esté en borrador; se completa al confirmar
      guia: item.envio ? {
        numeroGuia:         item.envio.numero_guiaenvios,
        estado:             item.envio.estadoenvios,
        valorCertificacion: Number(item.envio.valor_certificacionenvios),
      } : null,
      // null = usa remitente del lote al confirmar
      remitente: item.remitente_nombreenvios_masivos_items ? {
        nombre:       item.remitente_nombreenvios_masivos_items,
        documento:    item.remitente_documentoenvios_masivos_items,
        email:        item.remitente_emailenvios_masivos_items,
        telefono:     item.remitente_telefonoenvios_masivos_items,
        direccion:    item.remitente_direccionenvios_masivos_items,
        ciudad:       item.remitente_ciudadenvios_masivos_items,
        codigoPostal: item.remitente_cpenvios_masivos_items,
      } : null,
      destinatario: {
        nombre:       item.destinatario_nombreenvios_masivos_items,
        documento:    item.destinatario_documentoenvios_masivos_items,
        email:        item.destinatario_emailenvios_masivos_items,
        telefono:     item.destinatario_telefonoenvios_masivos_items,
        direccion:    item.destinatario_direccionenvios_masivos_items,
        ciudad:       item.destinatario_ciudadenvios_masivos_items,
        pais:         item.destinatario_paisenvios_masivos_items,
        codigoPostal: item.destinatario_cpenvios_masivos_items,
      },
      calculo: {
        pesoFisicoKg:       Number(item.peso_fisico_kgenvios_masivos_items),
        pesoTarificadoKg:   Number(item.peso_tarificado_kgenvios_masivos_items),
        valorServicio:      Number(item.valor_servicioenvios_masivos_items),
        valorEstampillas:   Number(item.valor_estampillasenvios_masivos_items),
        valorCertificacion: Number(item.valor_certificacionenvios_masivos_items ?? 0),
        valorTotal:         Number(item.valor_totalenvios_masivos_items),
      },
      contenido:     item.contenidoenvios_masivos_items,
      observaciones: item.observacionesenvios_masivos_items,
    };
  }

  static toLoteResumen(lote: any) {
    return {
      id:         lote.idenvios_masivos,
      estado:     lote.estadoenvios_masivos,
      cobrado:    lote.cobrado_atenvios_masivos != null,
      remitente:  lote.remitente_nombreenvios_masivos ?? '(múltiples orígenes)',
      totalItems: lote._count?.items ?? lote.total_itemsenvios_masivos,
      totalCop:   Number(lote.valor_totalenvios_masivos),
      createdAt:  lote.created_atenvios_masivos,
    };
  }
}
