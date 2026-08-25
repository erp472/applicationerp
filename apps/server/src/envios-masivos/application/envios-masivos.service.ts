import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService }   from '../../prisma/prisma.service.js';
import { VentasService }   from '../../ventas/application/ventas.service.js';
import { CajasService }    from '../../cajas/application/cajas.service.js';
import { StorageService }  from '../../storage/storage.service.js';
import {
  generarNumeroGuiaSecuencia,
  generarCodigoTrackingS10,
} from '../../ventas/domain/calculos/numero-guia-secuencia.js';
import {
  LoteNoEncontradoError,
  LoteNoEnBorradorError,
  ItemNoEncontradoError,
  LoteSinItemsError,
} from '../domain/envio-masivo.errors.js';
import { parsearCsv } from '../domain/parsear-csv.js';
import { generarGuiasMasivasPdf } from '../domain/guia-masiva-pdf.generator.js';
import { calcularTotalEnvioNacional } from '../../ventas/domain/calculos/total-envio-nacional.js';
import { calcularTotalEnvioInternacional } from '../../ventas/domain/calculos/total-envio-internacional.js';
import type { CrearLoteMasivoDto }           from '../dto/crear-lote.dto.js';
import type { AgregarItemMasivoDto, ActualizarItemMasivoDto } from '../dto/agregar-item.dto.js';
import type { CsvParseResult }               from '../dto/importar-csv.dto.js';

@Injectable()
export class EnviosMasivosService {
  constructor(
    private readonly prisma:   PrismaService,
    private readonly ventas:   VentasService,
    private readonly cajas:    CajasService,
    private readonly storage:  StorageService,
  ) {}

  // ── Crear lote ────────────────────────────────────────────────────────────────

  async crearLote(usuarioId: number, dto: CrearLoteMasivoDto) {
    const sesion = await this.cajas.getSesionActivaByCaja(dto.cajaId);
    if (!sesion) throw new BadRequestException(`No hay sesión activa en caja ${dto.cajaId}`);

    const servicio = await this.prisma.servicio.findUnique({
      where:  { idservicios: dto.servicioId },
      select: { activoservicios: true, deleted_atservicios: true },
    });
    if (!servicio || !servicio.activoservicios || servicio.deleted_atservicios) {
      throw new BadRequestException(`Servicio ${dto.servicioId} no existe o está inactivo`);
    }

    const lote = await this.prisma.envioMasivo.create({
      data: {
        sucursales_idsucursales:            dto.sucursalId,
        sesiones_caja_idsesiones_caja:      sesion.id,
        usuarios_idusuarios:                usuarioId,
        clientes_idclientes:                dto.clienteId ?? null,
        servicios_idservicios:              dto.servicioId,
        remitente_nombreenvios_masivos:     dto.remitente?.nombre ?? null,
        remitente_documentoenvios_masivos:  dto.remitente?.documento ?? null,
        remitente_emailenvios_masivos:      dto.remitente?.email ?? null,
        remitente_telefonoenvios_masivos:   dto.remitente?.telefono ?? null,
        remitente_direccionenvios_masivos:  dto.remitente?.direccion ?? null,
        remitente_ciudadenvios_masivos:     dto.remitente?.ciudad ?? null,
        remitente_cpenvios_masivos:         dto.remitente?.codigoPostal ?? null,
        observacionesenvios_masivos:        dto.observaciones ?? null,
      },
    });

    return lote;
  }

  // ── Consultar lote ────────────────────────────────────────────────────────────

  async getLote(id: number) {
    const lote = await this.prisma.envioMasivo.findUnique({
      where: { idenvios_masivos: id },
      include: {
        items: {
          orderBy: { numero_filaenvios_masivos_items: 'asc' },
          include: {
            envio: {
              select: {
                numero_guiaenvios:         true,
                estadoenvios:              true,
                valor_certificacionenvios: true,
              },
            },
          },
        },
        servicio: {
          select: {
            idservicios: true,
            nombreservicios: true,
            tiposervicios: true,
          },
        },
      },
    });
    if (!lote) throw new LoteNoEncontradoError(id);
    return lote;
  }

  async listarLotes(sucursalId: number, estado?: string) {
    return this.prisma.envioMasivo.findMany({
      where: {
        sucursales_idsucursales: sucursalId,
        ...(estado ? { estadoenvios_masivos: estado as any } : {}),
      },
      orderBy: { created_atenvios_masivos: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  // ── Agregar item (cotiza en tiempo real) ──────────────────────────────────────

  async agregarItem(loteId: number, dto: AgregarItemMasivoDto) {
    const lote = await this._getLoteEnBorrador(loteId);

    const cotizacion = await this.ventas.cotizarEnvio(
      lote.servicios_idservicios,
      dto.pesoFisicoKg,
      undefined, undefined, undefined,
      dto.destinatarioPais,
      dto.destinatarioCiudad,
    );

    const esInternacional    = dto.destinatarioPais !== 'CO';
    const valorServicio      = Number(cotizacion.valorServicio);
    const valorEstampillas   = cotizacion.servicio.requiereEstampilla ? valorServicio : 0;
    const valorCertificacion = esInternacional ? 0 : cotizacion.valorCertificacion;
    const valorTotal = esInternacional
      ? Number(calcularTotalEnvioInternacional(
          String(valorServicio), '0', String(valorEstampillas),
        ))
      : Number(calcularTotalEnvioNacional(
          String(valorServicio), String(valorEstampillas), '0', '0', String(valorCertificacion),
        ));

    const siguienteNumFila = await this._siguienteNumFila(loteId);

    const item = await this.prisma.envioMasivoItem.create({
      data: {
        envios_masivos_idenvios_masivos:            loteId,
        numero_filaenvios_masivos_items:            siguienteNumFila,
        // Remitente propio del item (puede ser null si el lote tiene remitente global)
        remitente_nombreenvios_masivos_items:       dto.remitente?.nombre ?? null,
        remitente_documentoenvios_masivos_items:    dto.remitente?.documento ?? null,
        remitente_emailenvios_masivos_items:        dto.remitente?.email ?? null,
        remitente_telefonoenvios_masivos_items:     dto.remitente?.telefono ?? null,
        remitente_direccionenvios_masivos_items:    dto.remitente?.direccion ?? null,
        remitente_ciudadenvios_masivos_items:       dto.remitente?.ciudad ?? null,
        remitente_cpenvios_masivos_items:           dto.remitente?.codigoPostal ?? null,
        destinatario_nombreenvios_masivos_items:    dto.destinatarioNombre,
        destinatario_documentoenvios_masivos_items: dto.destinatarioDocumento ?? null,
        destinatario_emailenvios_masivos_items:     dto.destinatarioEmail ?? null,
        destinatario_telefonoenvios_masivos_items:  dto.destinatarioTelefono ?? null,
        destinatario_direccionenvios_masivos_items: dto.destinatarioDireccion ?? null,
        destinatario_ciudadenvios_masivos_items:    dto.destinatarioCiudad ?? null,
        destinatario_paisenvios_masivos_items:      dto.destinatarioPais,
        destinatario_cpenvios_masivos_items:        dto.destinatarioCp ?? null,
        peso_fisico_kgenvios_masivos_items:         dto.pesoFisicoKg,
        peso_tarificado_kgenvios_masivos_items:     cotizacion.pesoTarificadoKg,
        valor_servicioenvios_masivos_items:         valorServicio,
        valor_estampillasenvios_masivos_items:      valorEstampillas,
        valor_certificacionenvios_masivos_items:    valorCertificacion,
        valor_totalenvios_masivos_items:            valorTotal,
        contenidoenvios_masivos_items:              dto.contenido ?? null,
        observacionesenvios_masivos_items:          dto.observaciones ?? null,
      },
    });

    await this._recalcularTotalesLote(loteId);
    return { item, cotizacion: { pesoTarificado: cotizacion.pesoTarificadoKg, valorServicio, valorCertificacion } };
  }

  // ── Actualizar item ────────────────────────────────────────────────────────────

  async actualizarItem(loteId: number, itemId: number, dto: ActualizarItemMasivoDto) {
    const lote = await this._getLoteEnBorrador(loteId);
    const item = await this._getItemDelLote(loteId, itemId);

    const pesoFisicoKg = dto.pesoFisicoKg ?? Number(item.peso_fisico_kgenvios_masivos_items);
    const pais         = dto.destinatarioPais ?? item.destinatario_paisenvios_masivos_items;
    const ciudad       = dto.destinatarioCiudad ?? item.destinatario_ciudadenvios_masivos_items ?? undefined;

    const cotizacion = await this.ventas.cotizarEnvio(
      lote.servicios_idservicios,
      pesoFisicoKg,
      undefined, undefined, undefined,
      pais,
      ciudad,
    );

    const esInternacional    = pais !== 'CO';
    const valorServicio      = Number(cotizacion.valorServicio);
    const valorEstampillas   = cotizacion.servicio.requiereEstampilla ? valorServicio : 0;
    const valorCertificacion = esInternacional ? 0 : cotizacion.valorCertificacion;
    const valorTotal = esInternacional
      ? Number(calcularTotalEnvioInternacional(
          String(valorServicio), '0', String(valorEstampillas),
        ))
      : Number(calcularTotalEnvioNacional(
          String(valorServicio), String(valorEstampillas), '0', '0', String(valorCertificacion),
        ));

    const itemActualizado = await this.prisma.envioMasivoItem.update({
      where: { idenvios_masivos_items: itemId },
      data: {
        // Remitente por item
        ...(dto.remitente !== undefined && {
          remitente_nombreenvios_masivos_items:    dto.remitente?.nombre ?? null,
          remitente_documentoenvios_masivos_items: dto.remitente?.documento ?? null,
          remitente_emailenvios_masivos_items:     dto.remitente?.email ?? null,
          remitente_telefonoenvios_masivos_items:  dto.remitente?.telefono ?? null,
          remitente_direccionenvios_masivos_items: dto.remitente?.direccion ?? null,
          remitente_ciudadenvios_masivos_items:    dto.remitente?.ciudad ?? null,
          remitente_cpenvios_masivos_items:        dto.remitente?.codigoPostal ?? null,
        }),
        ...(dto.destinatarioNombre    && { destinatario_nombreenvios_masivos_items:    dto.destinatarioNombre }),
        ...(dto.destinatarioDocumento !== undefined && { destinatario_documentoenvios_masivos_items: dto.destinatarioDocumento }),
        ...(dto.destinatarioEmail     !== undefined && { destinatario_emailenvios_masivos_items:     dto.destinatarioEmail }),
        ...(dto.destinatarioTelefono  !== undefined && { destinatario_telefonoenvios_masivos_items:  dto.destinatarioTelefono }),
        ...(dto.destinatarioDireccion !== undefined && { destinatario_direccionenvios_masivos_items: dto.destinatarioDireccion }),
        ...(dto.destinatarioCiudad    !== undefined && { destinatario_ciudadenvios_masivos_items:    dto.destinatarioCiudad }),
        ...(dto.destinatarioPais      && { destinatario_paisenvios_masivos_items: dto.destinatarioPais }),
        ...(dto.destinatarioCp        !== undefined && { destinatario_cpenvios_masivos_items:        dto.destinatarioCp }),
        peso_fisico_kgenvios_masivos_items:         pesoFisicoKg,
        peso_tarificado_kgenvios_masivos_items:     cotizacion.pesoTarificadoKg,
        valor_servicioenvios_masivos_items:         valorServicio,
        valor_estampillasenvios_masivos_items:      valorEstampillas,
        valor_certificacionenvios_masivos_items:    valorCertificacion,
        valor_totalenvios_masivos_items:            valorTotal,
        ...(dto.contenido      !== undefined && { contenidoenvios_masivos_items:    dto.contenido }),
        ...(dto.observaciones  !== undefined && { observacionesenvios_masivos_items: dto.observaciones }),
      },
    });

    await this._recalcularTotalesLote(loteId);
    return { item: itemActualizado, cotizacion: { pesoTarificado: cotizacion.pesoTarificadoKg, valorServicio, valorCertificacion } };
  }

  // ── Eliminar item ─────────────────────────────────────────────────────────────

  async eliminarItem(loteId: number, itemId: number) {
    await this._getLoteEnBorrador(loteId);
    await this._getItemDelLote(loteId, itemId);

    await this.prisma.envioMasivoItem.delete({ where: { idenvios_masivos_items: itemId } });
    await this._recalcularTotalesLote(loteId);
    await this._renumerarFilas(loteId);
  }

  // ── Importar CSV ──────────────────────────────────────────────────────────────

  async importarCsv(loteId: number, csvTexto: string): Promise<{ importados: number; errores: CsvParseResult['errores'] }> {
    await this._getLoteEnBorrador(loteId);
    const { filas, errores } = parsearCsv(csvTexto);

    let importados = 0;
    for (const fila of filas) {
      try {
        await this.agregarItem(loteId, {
          remitente:             fila.remitente
            ? {
                nombre:       fila.remitente.nombre,
                documento:    fila.remitente.documento,
                email:        fila.remitente.email,
                telefono:     fila.remitente.telefono,
                direccion:    fila.remitente.direccion,
                ciudad:       fila.remitente.ciudad,
                codigoPostal: fila.remitente.cp,
              }
            : undefined,
          destinatarioNombre:    fila.nombre,
          destinatarioDocumento: fila.documento,
          destinatarioEmail:     fila.email,
          destinatarioTelefono:  fila.telefono,
          destinatarioDireccion: fila.direccion,
          destinatarioCiudad:    fila.ciudad,
          destinatarioPais:      fila.pais || 'CO',
          destinatarioCp:        fila.codigoPostal,
          pesoFisicoKg:          fila.pesoKg,
          contenido:             fila.contenido,
        });
        importados++;
      } catch (err: any) {
        errores.push({ fila: importados + errores.length + 2, error: err.message });
      }
    }

    return { importados, errores };
  }

  // ── Confirmar lote → crea Envios reales (SIN registrar cobro) ────────────────

  async confirmarLote(loteId: number, cajaId: number, usuarioId: number) {
    const lote = await this._getLoteEnBorrador(loteId);
    const items = await this.prisma.envioMasivoItem.findMany({
      where: { envios_masivos_idenvios_masivos: loteId },
      orderBy: { numero_filaenvios_masivos_items: 'asc' },
    });
    if (items.length === 0) throw new LoteSinItemsError();

    const sesion = await this.cajas.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new BadRequestException(`No hay sesión activa en caja ${cajaId}`);

    const servicio = await this.prisma.servicio.findUnique({
      where: { idservicios: lote.servicios_idservicios },
      select: { tiposervicios: true, prefijo_guia_servicios: true },
    });
    const prefijoGuia = servicio?.prefijo_guia_servicios ?? 'GU';

    // Pre-validar todos los remitentes antes de crear ningún Envío (evita estado parcial)
    for (const item of items) {
      const remNombre = item.remitente_nombreenvios_masivos_items ?? lote.remitente_nombreenvios_masivos;
      if (!remNombre) {
        throw new BadRequestException(
          `Item fila ${item.numero_filaenvios_masivos_items} no tiene remitente y el lote tampoco tiene remitente global`,
        );
      }
    }

    // Generar todos los números de guía ANTES de cualquier inserción usando una
    // secuencia atómica por advisory lock para evitar colisiones bajo concurrencia.
    const prefijo    = prefijoGuia;
    const guiasPlans = await this._reservarConsecutivosGuia(items.length, prefijo, servicio?.prefijo_guia_servicios ?? null);

    const guias: Array<{ fila: number; numeroGuia: string; envioId: number }> = [];

    for (let i = 0; i < items.length; i++) {
      const item    = items[i];
      const plan    = guiasPlans[i];

      const remNombre    = (item.remitente_nombreenvios_masivos_items    ?? lote.remitente_nombreenvios_masivos)!;
      const remDocumento = item.remitente_documentoenvios_masivos_items ?? lote.remitente_documentoenvios_masivos;
      const remEmail     = item.remitente_emailenvios_masivos_items     ?? lote.remitente_emailenvios_masivos;
      const remTelefono  = item.remitente_telefonoenvios_masivos_items  ?? lote.remitente_telefonoenvios_masivos;
      const remDireccion = item.remitente_direccionenvios_masivos_items ?? lote.remitente_direccionenvios_masivos;
      const remCiudad    = item.remitente_ciudadenvios_masivos_items    ?? lote.remitente_ciudadenvios_masivos;
      const remCp        = item.remitente_cpenvios_masivos_items        ?? lote.remitente_cpenvios_masivos;

      const envio = await this.prisma.envio.create({
        data: {
          numero_guiaenvios:               plan.numeroGuia,
          numero_guia_fisicaenvios:        plan.codigoTracking,
          tipoenvios:                      (servicio?.tiposervicios ?? 'nacional') as any,
          es_correspondenciaenvios:        true,
          sucursales_idsucursales:         lote.sucursales_idsucursales,
          sesiones_caja_idsesiones_caja:   lote.sesiones_caja_idsesiones_caja,
          usuarios_idusuarios:             usuarioId,
          clientes_idclientes:             lote.clientes_idclientes,
          servicios_idservicios:           lote.servicios_idservicios,
          remitente_nombreenvios:          remNombre,
          remitente_documentoenvios:       remDocumento,
          remitente_emailenvios:           remEmail,
          remitente_telefonoenvios:        remTelefono,
          remitente_direccionenvios:       remDireccion,
          remitente_ciudadenvios:          remCiudad,
          remitente_codigo_postalenvios:   remCp,
          destinatario_nombreenvios:       item.destinatario_nombreenvios_masivos_items,
          destinatario_documentoenvios:    item.destinatario_documentoenvios_masivos_items,
          destinatario_emailenvios:        item.destinatario_emailenvios_masivos_items,
          destinatario_telefonoenvios:     item.destinatario_telefonoenvios_masivos_items,
          destinatario_direccionenvios:    item.destinatario_direccionenvios_masivos_items,
          destinatario_ciudadenvios:       item.destinatario_ciudadenvios_masivos_items,
          destinatario_paisenvios:         item.destinatario_paisenvios_masivos_items,
          destinatario_codigo_postalenvios: item.destinatario_cpenvios_masivos_items,
          peso_fisico_kgenvios:            item.peso_fisico_kgenvios_masivos_items,
          peso_tarificado_kgenvios:        item.peso_tarificado_kgenvios_masivos_items,
          valor_servicioenvios:            item.valor_servicioenvios_masivos_items,
          valor_estampillasenvios:         item.valor_estampillasenvios_masivos_items,
          valor_seguroenvios:              0,
          valor_certificacionenvios:       item.valor_certificacionenvios_masivos_items,
          valor_totalenvios:               item.valor_totalenvios_masivos_items,
          // El medio de pago y estado se actualizan al cobrar (paso 2)
          medio_pagoenvios:                'preporteado' as any,
          estadoenvios:                    'facturado' as any,
          observacionesenvios:             item.observacionesenvios_masivos_items,
        },
      });

      await this.prisma.envioMasivoItem.update({
        where: { idenvios_masivos_items: item.idenvios_masivos_items },
        data:  { envios_idenvios: envio.idenvios },
      });

      guias.push({ fila: item.numero_filaenvios_masivos_items, numeroGuia: plan.numeroGuia, envioId: envio.idenvios });
    }

    await this.prisma.envioMasivo.update({
      where: { idenvios_masivos: loteId },
      data:  { estadoenvios_masivos: 'confirmado', updated_atenvios_masivos: new Date() },
    });

    return { loteId, enviosCreados: guias.length, guias };
  }

  // ── Cobrar lote confirmado → registra movimiento de caja ──────────────────────

  async cobrarLote(loteId: number, cajaId: number, medioPago: string) {
    const lote = await this.prisma.envioMasivo.findUnique({
      where:  { idenvios_masivos: loteId },
      select: {
        idenvios_masivos:              true,
        estadoenvios_masivos:          true,
        cobrado_atenvios_masivos:      true,
        valor_totalenvios_masivos:     true,
        sesiones_caja_idsesiones_caja: true,
        items: { select: { envios_idenvios: true } },
      },
    });
    if (!lote) throw new LoteNoEncontradoError(loteId);
    if (lote.estadoenvios_masivos !== 'confirmado') {
      throw new BadRequestException('Solo se pueden cobrar lotes en estado confirmado');
    }
    if (lote.cobrado_atenvios_masivos) {
      throw new BadRequestException('Este lote ya fue cobrado');
    }

    const sesion = await this.cajas.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new BadRequestException(`No hay sesión activa en caja ${cajaId}`);

    const valorTotal = Number(lote.valor_totalenvios_masivos);

    const { movimiento, saldoActual, alertas } = await this.cajas.registrarMovimientoVenta({
      sesionCajaId:   sesion.id,
      tipo:           'venta_servicio',
      monto:          String(valorTotal),
      medioPago:      medioPago as any,
      referenciaId:   loteId,
      referenciaTipo: 'EnvioMasivo',
    });

    // Actualizar medio_pago en los envíos (el estado logístico permanece 'facturado')
    const envioIds = lote.items
      .map(i => i.envios_idenvios)
      .filter((id): id is number => id !== null);

    if (envioIds.length > 0) {
      await this.prisma.envio.updateMany({
        where: { idenvios: { in: envioIds } },
        data:  { medio_pagoenvios: medioPago as any },
      });
    }

    await this.prisma.envioMasivo.update({
      where: { idenvios_masivos: loteId },
      data:  {
        cobrado_atenvios_masivos:        new Date(),
        medio_pago_cobroenvios_masivos:  medioPago,
        updated_atenvios_masivos:        new Date(),
      },
    });

    return { loteId, movimiento, saldoActual, alertas };
  }

  // ── Generar PDF de guías ──────────────────────────────────────────────────────

  async generarGuiasPdf(loteId: number): Promise<{ relPath: string; absolutePath: string; totalGuias: number }> {
    const lote = await this.prisma.envioMasivo.findUnique({
      where:   { idenvios_masivos: loteId },
      include: {
        items:   { orderBy: { numero_filaenvios_masivos_items: 'asc' } },
        servicio: { select: { nombreservicios: true } },
      },
    });
    if (!lote) throw new NotFoundException(`Lote ${loteId} no encontrado`);
    if (lote.estadoenvios_masivos !== 'confirmado') {
      throw new BadRequestException('Solo se pueden generar guías para lotes confirmados');
    }

    const itemsConGuia = lote.items.filter(i => i.envios_idenvios !== null);
    if (itemsConGuia.length === 0) {
      throw new BadRequestException('El lote no tiene envíos creados');
    }

    // Fetch all envio fields needed for the PDF
    const envioIds = itemsConGuia.map(i => i.envios_idenvios!);
    const envios = await this.prisma.envio.findMany({
      where:  { idenvios: { in: envioIds } },
      select: {
        idenvios:                  true,
        numero_guiaenvios:         true,
        numero_guia_fisicaenvios:  true,
        peso_tarificado_kgenvios:  true,
        valor_servicioenvios:      true,
        valor_certificacionenvios: true,
        valor_totalenvios:         true,
        created_atenvios:          true,
      },
    });
    const envioMap = new Map(envios.map(e => [e.idenvios, e]));

    const nombreServicio = lote.servicio?.nombreservicios ?? 'Postal';

    const pdfItems = itemsConGuia.map(item => {
      const envio = envioMap.get(item.envios_idenvios!)!;
      return {
        loteId,
        fila:              item.numero_filaenvios_masivos_items,
        numeroGuia:        envio.numero_guiaenvios,
        codigoTracking:    envio.numero_guia_fisicaenvios,
        remitente: {
          nombre:    (item.remitente_nombreenvios_masivos_items  ?? lote.remitente_nombreenvios_masivos)!,
          documento: item.remitente_documentoenvios_masivos_items ?? lote.remitente_documentoenvios_masivos,
          direccion: item.remitente_direccionenvios_masivos_items ?? lote.remitente_direccionenvios_masivos,
          ciudad:    item.remitente_ciudadenvios_masivos_items    ?? lote.remitente_ciudadenvios_masivos,
          telefono:  item.remitente_telefonoenvios_masivos_items  ?? lote.remitente_telefonoenvios_masivos,
          cp:        item.remitente_cpenvios_masivos_items        ?? lote.remitente_cpenvios_masivos,
        },
        destinatario: {
          nombre:    item.destinatario_nombreenvios_masivos_items,
          documento: item.destinatario_documentoenvios_masivos_items,
          direccion: item.destinatario_direccionenvios_masivos_items,
          ciudad:    item.destinatario_ciudadenvios_masivos_items,
          pais:      item.destinatario_paisenvios_masivos_items,
          telefono:  item.destinatario_telefonoenvios_masivos_items,
          cp:        item.destinatario_cpenvios_masivos_items,
        },
        servicio:           nombreServicio,
        pesoFisicoKg:       Number(item.peso_fisico_kgenvios_masivos_items),
        pesoTarificadoKg:   Number(envio.peso_tarificado_kgenvios),
        valorServicio:      Number(envio.valor_servicioenvios),
        valorCertificacion: Number(envio.valor_certificacionenvios),
        valorTotal:         Number(envio.valor_totalenvios),
        contenido:          item.contenidoenvios_masivos_items,
        observaciones:      item.observacionesenvios_masivos_items,
        fecha:              envio.created_atenvios,
      };
    });

    const buffer  = await generarGuiasMasivasPdf(pdfItems);
    const relPath = `guias-masivas/lote-${loteId}.pdf`;
    await this.storage.savePdf(relPath, buffer);

    await this.prisma.envioMasivo.update({
      where: { idenvios_masivos: loteId },
      data:  { pdf_guias_pathenvios_masivos: relPath, updated_atenvios_masivos: new Date() },
    });

    return { relPath, absolutePath: this.storage.absolutePath(relPath), totalGuias: pdfItems.length };
  }

  async getPdfPath(loteId: number): Promise<string | null> {
    const row = await this.prisma.envioMasivo.findUnique({
      where:  { idenvios_masivos: loteId },
      select: { pdf_guias_pathenvios_masivos: true },
    });
    return row?.pdf_guias_pathenvios_masivos ?? null;
  }

  getPdfAbsolutePath(relPath: string): string {
    return this.storage.absolutePath(relPath);
  }

  // ── Eliminar lote (borrador o anulado) ───────────────────────────────────────

  async eliminarLote(loteId: number) {
    const lote = await this.prisma.envioMasivo.findUnique({
      where:  { idenvios_masivos: loteId },
      select: { estadoenvios_masivos: true },
    });
    if (!lote) throw new LoteNoEncontradoError(loteId);
    if (lote.estadoenvios_masivos === 'confirmado') {
      throw new BadRequestException('No se puede eliminar un lote confirmado');
    }
    try {
      await this.prisma.envioMasivoItem.deleteMany({
        where: { envios_masivos_idenvios_masivos: loteId },
      });
      await this.prisma.envioMasivo.delete({ where: { idenvios_masivos: loteId } });
    } catch (err: any) {
      throw new BadRequestException(
        `No se pudo eliminar el lote: ${err?.meta?.cause ?? err?.message ?? String(err)}`,
      );
    }
  }

  // ── Helpers privados ───────────────────────────────────────────────────────────

  private async _getLoteEnBorrador(loteId: number) {
    const lote = await this.prisma.envioMasivo.findUnique({
      where: { idenvios_masivos: loteId },
    });
    if (!lote) throw new LoteNoEncontradoError(loteId);
    if (lote.estadoenvios_masivos !== 'borrador') throw new LoteNoEnBorradorError(loteId);
    return lote;
  }

  private async _getItemDelLote(loteId: number, itemId: number) {
    const item = await this.prisma.envioMasivoItem.findUnique({
      where: { idenvios_masivos_items: itemId },
    });
    if (!item || item.envios_masivos_idenvios_masivos !== loteId) {
      throw new ItemNoEncontradoError(itemId);
    }
    return item;
  }

  private async _siguienteNumFila(loteId: number): Promise<number> {
    const last = await this.prisma.envioMasivoItem.findFirst({
      where:   { envios_masivos_idenvios_masivos: loteId },
      orderBy: { numero_filaenvios_masivos_items: 'desc' },
      select:  { numero_filaenvios_masivos_items: true },
    });
    return (last?.numero_filaenvios_masivos_items ?? 0) + 1;
  }

  private async _recalcularTotalesLote(loteId: number) {
    const agg = await this.prisma.envioMasivoItem.aggregate({
      where: { envios_masivos_idenvios_masivos: loteId },
      _count: { idenvios_masivos_items: true },
      _sum:   {
        peso_fisico_kgenvios_masivos_items:          true,
        valor_estampillasenvios_masivos_items:       true,
        valor_certificacionenvios_masivos_items:     true,
        valor_totalenvios_masivos_items:             true,
      },
    });

    await this.prisma.envioMasivo.update({
      where: { idenvios_masivos: loteId },
      data: {
        total_itemsenvios_masivos:          agg._count.idenvios_masivos_items,
        total_peso_kgenvios_masivos:        agg._sum.peso_fisico_kgenvios_masivos_items         ?? 0,
        total_estampillasenvios_masivos:    agg._sum.valor_estampillasenvios_masivos_items      ?? 0,
        total_certificacionenvios_masivos:  agg._sum.valor_certificacionenvios_masivos_items    ?? 0,
        valor_totalenvios_masivos:          agg._sum.valor_totalenvios_masivos_items            ?? 0,
        updated_atenvios_masivos:           new Date(),
      },
    });
  }

  private async _renumerarFilas(loteId: number) {
    const items = await this.prisma.envioMasivoItem.findMany({
      where:   { envios_masivos_idenvios_masivos: loteId },
      orderBy: { idenvios_masivos_items: 'asc' },
      select:  { idenvios_masivos_items: true },
    });
    for (let i = 0; i < items.length; i++) {
      await this.prisma.envioMasivoItem.update({
        where: { idenvios_masivos_items: items[i].idenvios_masivos_items },
        data:  { numero_filaenvios_masivos_items: i + 1 },
      });
    }
  }

  // Reserva N consecutivos de forma atómica usando pg_advisory_xact_lock para
  // serializar confirmaciones concurrentes. El UNIQUE en numero_guiaenvios actúa
  // como red de seguridad si dos procesos generan el mismo consecutivo.
  private async _reservarConsecutivosGuia(
    cantidad:   number,
    prefijo:    string,
    prefijoS10: string | null,
  ): Promise<Array<{ numeroGuia: string; codigoTracking: string | null }>> {
    return this.prisma.$transaction(async (tx) => {
      // Advisory lock exclusivo para generación de guías (clave fija arbitraria)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(472000001)`;
      const [row] = await tx.$queryRaw<[{ max: bigint | null }]>`
        SELECT MAX(idenvios) AS max FROM envios
      `;
      const base = Number(row.max ?? 0);
      return Array.from({ length: cantidad }, (_, i) => {
        const consecutivo = base + i + 1;
        return {
          numeroGuia:     generarNumeroGuiaSecuencia(prefijo, consecutivo),
          codigoTracking: prefijoS10
            ? generarCodigoTrackingS10(prefijoS10, consecutivo)
            : null,
        };
      });
    });
  }
}
