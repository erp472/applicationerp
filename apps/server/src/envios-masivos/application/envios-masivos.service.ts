import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'node:fs';
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
    const { data, cotizacion } = await this._cotizarFila(lote.servicios_idservicios, dto);

    const item = await this.prisma.envioMasivoItem.create({
      data: {
        envios_masivos_idenvios_masivos: loteId,
        numero_filaenvios_masivos_items: await this._siguienteNumFila(loteId),
        ...data,
      },
    });

    await this._recalcularTotalesLote(loteId);
    return { item, cotizacion };
  }

  // ── Agregar items en bloque ───────────────────────────────────────────────────
  // Cotiza todas las filas fuera de la transacción (solo lecturas) y luego inserta
  // las válidas de una sola vez. Una fila inválida no aborta el resto.

  async agregarItems(loteId: number, dtos: AgregarItemMasivoDto[]) {
    const lote = await this._getLoteEnBorrador(loteId);

    const cotizadas: Array<Record<string, unknown>> = [];
    const errores: Array<{ fila: number; error: string }> = [];

    for (let i = 0; i < dtos.length; i++) {
      try {
        const { data } = await this._cotizarFila(lote.servicios_idservicios, dtos[i]);
        cotizadas.push(data);
      } catch (err: any) {
        errores.push({ fila: i + 1, error: err?.message ?? String(err) });
      }
    }

    let agregados = 0;
    if (cotizadas.length > 0) {
      const primeraFila = await this._siguienteNumFila(loteId);
      await this.prisma.$transaction(async (tx) => {
        await tx.envioMasivoItem.createMany({
          data: cotizadas.map((data, i) => ({
            envios_masivos_idenvios_masivos: loteId,
            numero_filaenvios_masivos_items: primeraFila + i,
            ...data,
          })) as any,
        });
      });
      agregados = cotizadas.length;
      await this._recalcularTotalesLote(loteId);
    }

    return { agregados, errores };
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
    const { filas, errores } = parsearCsv(csvTexto);
    if (filas.length === 0) return { importados: 0, errores };

    const { agregados, errores: erroresCotizacion } = await this.agregarItems(
      loteId,
      filas.map(fila => ({
        remitente: fila.remitente
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
      })),
    );

    // +1 por la cabecera del CSV: la fila N del parser es la línea N+1 del archivo
    errores.push(...erroresCotizacion.map(e => ({ fila: e.fila + 1, error: e.error })));
    return { importados: agregados, errores };
  }

  // ── Confirmar lote → crea los Envios y los manda al carrito de la venta ──────
  // Los envíos quedan en estado 'pendiente' vinculados a la venta: se facturan y
  // se cobran cuando el cajero confirma el pago del carrito.

  async confirmarLote(loteId: number, cajaId: number, usuarioId: number, ventaId: number) {
    const lote = await this._getLoteEnBorrador(loteId);
    const items = await this.prisma.envioMasivoItem.findMany({
      where: { envios_masivos_idenvios_masivos: loteId },
      orderBy: { numero_filaenvios_masivos_items: 'asc' },
    });
    if (items.length === 0) throw new LoteSinItemsError();

    const sesion = await this.cajas.getSesionActivaByCaja(cajaId);
    if (!sesion) throw new BadRequestException(`No hay sesión activa en caja ${cajaId}`);

    // getCarrito valida que la venta exista y esté activa
    const venta = await this.ventas.getCarrito(ventaId);
    if (venta.sesionCajaId !== sesion.id) {
      throw new BadRequestException(`La venta ${ventaId} pertenece a otra sesión de caja`);
    }

    const servicio = await this.prisma.servicio.findUnique({
      where: { idservicios: lote.servicios_idservicios },
      select: { tiposervicios: true, prefijo_guia_servicios: true },
    });

    // Pre-validar todos los remitentes antes de crear ningún Envío (evita estado parcial)
    for (const item of items) {
      const remNombre = item.remitente_nombreenvios_masivos_items ?? lote.remitente_nombreenvios_masivos;
      if (!remNombre) {
        throw new BadRequestException(
          `Item fila ${item.numero_filaenvios_masivos_items} no tiene remitente y el lote tampoco tiene remitente global`,
        );
      }
    }

    const guiasPlans = await this._reservarConsecutivosGuia(
      items.length,
      servicio?.prefijo_guia_servicios ?? 'GU',
      servicio?.prefijo_guia_servicios ?? null,
    );

    const guias = await this.prisma.$transaction(async (tx) => {
      const creadas: Array<{ fila: number; numeroGuia: string; envioId: number }> = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const plan = guiasPlans[i];

        const remNombre    = (item.remitente_nombreenvios_masivos_items    ?? lote.remitente_nombreenvios_masivos)!;
        const remDocumento = item.remitente_documentoenvios_masivos_items ?? lote.remitente_documentoenvios_masivos;
        const remEmail     = item.remitente_emailenvios_masivos_items     ?? lote.remitente_emailenvios_masivos;
        const remTelefono  = item.remitente_telefonoenvios_masivos_items  ?? lote.remitente_telefonoenvios_masivos;
        const remDireccion = item.remitente_direccionenvios_masivos_items ?? lote.remitente_direccionenvios_masivos;
        const remCiudad    = item.remitente_ciudadenvios_masivos_items    ?? lote.remitente_ciudadenvios_masivos;
        const remCp        = item.remitente_cpenvios_masivos_items        ?? lote.remitente_cpenvios_masivos;

        const envio = await tx.envio.create({
          data: {
            numero_guiaenvios:               plan.numeroGuia,
            numero_guia_fisicaenvios:        plan.codigoTracking,
            tipoenvios:                      (servicio?.tiposervicios ?? 'nacional') as any,
            es_correspondenciaenvios:        true,
            ventas_idventas:                 ventaId,
            sucursales_idsucursales:         lote.sucursales_idsucursales,
            sesiones_caja_idsesiones_caja:   sesion.id,
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
            // El medio de pago se fija al confirmar el pago de la venta
            estadoenvios:                    'pendiente' as any,
            contenidoenvios:                 item.contenidoenvios_masivos_items,
            observacionesenvios:             item.observacionesenvios_masivos_items,
          },
        });

        await tx.envioMasivoItem.update({
          where: { idenvios_masivos_items: item.idenvios_masivos_items },
          data:  { envios_idenvios: envio.idenvios },
        });

        creadas.push({
          fila:       item.numero_filaenvios_masivos_items,
          numeroGuia: plan.numeroGuia,
          envioId:    envio.idenvios,
        });
      }

      await tx.envioMasivo.update({
        where: { idenvios_masivos: loteId },
        data:  {
          estadoenvios_masivos:     'confirmado',
          ventas_idventas:          ventaId,
          updated_atenvios_masivos: new Date(),
        },
      });

      return creadas;
    }, { timeout: 120_000, maxWait: 20_000 });

    const carrito = await this.ventas.recalcularTotalesCarrito(ventaId);

    return {
      loteId,
      ventaId,
      enviosCreados: guias.length,
      guias,
      totalCarrito:  carrito?.total ?? 0,
    };
  }

  // ── Generar PDF de guías ──────────────────────────────────────────────────────

  async generarGuiasPdf(loteId: number): Promise<{ relPath: string; absolutePath: string; totalGuias: number }> {
    const lote = await this.prisma.envioMasivo.findUnique({
      where:   { idenvios_masivos: loteId },
      include: {
        items:    { orderBy: { numero_filaenvios_masivos_items: 'asc' } },
        servicio: { select: { nombreservicios: true } },
        sucursal: { select: { codigosucursales: true, nombresucursales: true } },
      },
    });
    if (!lote) throw new NotFoundException(`Lote ${loteId} no encontrado`);
    if (lote.estadoenvios_masivos !== 'confirmado') {
      throw new BadRequestException('Solo se pueden generar guías para lotes confirmados');
    }
    if (!lote.cobrado_atenvios_masivos) {
      throw new BadRequestException('El lote aún no ha sido pagado: confirma el pago del carrito antes de imprimir las guías');
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

    const sucursal = {
      codigo: lote.sucursal?.codigosucursales ?? '',
      nombre: lote.sucursal?.nombresucursales ?? '',
    };
    const buffer  = await generarGuiasMasivasPdf(pdfItems, sucursal);
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

  // El PDF se genera la primera vez que alguien lo descarga tras el pago.
  async getOGenerarPdfPath(loteId: number): Promise<string> {
    const relPath = await this.getPdfPath(loteId);
    if (relPath) {
      try {
        await fs.promises.access(this.storage.absolutePath(relPath));
        return relPath;
      } catch { /* el archivo se perdió del disco: se regenera */ }
    }
    return (await this.generarGuiasPdf(loteId)).relPath;
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

  // Cotiza una fila y devuelve las columnas listas para insertar en envios_masivos_items.
  private async _cotizarFila(servicioId: number, dto: AgregarItemMasivoDto) {
    const cotizacion = await this.ventas.cotizarEnvio(
      servicioId,
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

    return {
      cotizacion: { pesoTarificado: cotizacion.pesoTarificadoKg, valorServicio, valorCertificacion },
      data: {
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
    };
  }

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

  // Reserva N consecutivos de la secuencia dedicada envios_guia_seq. nextval es
  // atómico y nunca devuelve el mismo valor dos veces, así que las confirmaciones
  // concurrentes y las ventas individuales no pueden colisionar.
  private async _reservarConsecutivosGuia(
    cantidad:   number,
    prefijo:    string,
    prefijoS10: string | null,
  ): Promise<Array<{ numeroGuia: string; codigoTracking: string | null }>> {
    const rows = await this.prisma.$queryRaw<Array<{ consecutivo: bigint }>>`
      SELECT nextval('envios_guia_seq') AS consecutivo
      FROM generate_series(1, ${cantidad}::int)
    `;
    return rows.map(({ consecutivo }) => {
      const n = Number(consecutivo);
      return {
        numeroGuia:     generarNumeroGuiaSecuencia(prefijo, n),
        codigoTracking: prefijoS10 ? generarCodigoTrackingS10(prefijoS10, n) : null,
      };
    });
  }
}
