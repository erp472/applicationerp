import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IGirosRepository, ICrearGiroNacionalData, ICrearGiroInternacionalData } from '../domain/giro.repository.js';
import type { GiroEntity, TipoGiro, EstadoGiro, FleteAsumidoPor, ResultadoInspektor } from '../domain/giro.entity.js';

const SELECT_GIRO = {
  idgiros:                              true,
  tipogiros:                            true,
  operaciongiros:                       true,
  sucursales_idsucursales:              true,
  sesiones_caja_idsesiones_caja:        true,
  usuarios_idusuarios:                  true,
  clientes_idclientes_remitente:        true,
  remitente_tipo_docgiros:              true,
  remitente_numero_docgiros:            true,
  remitente_nombregiros:                true,
  remitente_fecha_exp_docgiros:         true,
  remitente_ciudadgiros:                true,
  remitente_direcciongiros:             true,
  remitente_emailgiros:                 true,
  remitente_huellagiros:                true,
  beneficiario_huellagiros:             true,
  beneficiario_pepgiros:                true,
  beneficiario_sospechosogiros:         true,
  beneficiario_tipo_docgiros:           true,
  beneficiario_numero_docgiros:         true,
  beneficiario_nombregiros:             true,
  beneficiario_fecha_nacgiros:          true,
  beneficiario_paisgiros:               true,
  beneficiario_estadogiros:             true,
  beneficiario_ciudadgiros:             true,
  sucursales_idsucursales_beneficiario: true,
  beneficiario_direcciongiros:          true,
  beneficiario_telefonogiros:           true,
  beneficiario_mensajegiros:            true,
  monto_copgiros:                       true,
  flete_copgiros:                       true,
  flete_asumido_porgiros:               true,
  monto_total_copgiros:                 true,
  monto_destinogiros:                   true,
  moneda_destinogiros:                  true,
  tasa_cambiogiros:                     true,
  pingiros:                             true,
  numero_referenciagiros:               true,
  referencia_proveedorgiros:            true,
  consulta_inspektorgiros:              true,
  resultado_inspektorgiros:             true,
  inspektor_referenciagiros:            true,
  estadogiros:                          true,
  formulario_5giros:                    true,
  declaracion_origengiros:              true,
  fotocopia_cedulagiros:                true,
  reportado_minticgiros:                true,
  created_atgiros:                      true,
  updated_atgiros:                      true,
} satisfies Prisma.GiroSelect;

type GiroRow = Prisma.GiroGetPayload<{ select: typeof SELECT_GIRO }>;

function toGiroEntity(row: GiroRow): GiroEntity {
  return {
    id:                     row.idgiros,
    tipo:                   row.tipogiros as TipoGiro,
    operacion:              row.operaciongiros as 'emision' | 'pago',
    sucursalId:             row.sucursales_idsucursales,
    sesionCajaId:           row.sesiones_caja_idsesiones_caja,
    usuarioId:              row.usuarios_idusuarios,
    clienteRemitenteId:     row.clientes_idclientes_remitente,
    remitenteTipoDoc:       row.remitente_tipo_docgiros,
    remitenteNumeroDoc:     row.remitente_numero_docgiros,
    remitenteNombre:        row.remitente_nombregiros,
    remitenteFechaExpDoc:   row.remitente_fecha_exp_docgiros,
    remitenteCiudad:        row.remitente_ciudadgiros,
    remitenteDireccion:     row.remitente_direcciongiros,
    remitenteEmail:         row.remitente_emailgiros,
    remitenteHuella:        row.remitente_huellagiros,
    beneficiarioHuella:     row.beneficiario_huellagiros,
    beneficiarioPep:        row.beneficiario_pepgiros,
    beneficiarioSospechoso: row.beneficiario_sospechosogiros,
    beneficiarioTipoDoc:    row.beneficiario_tipo_docgiros,
    beneficiarioNumeroDoc:  row.beneficiario_numero_docgiros,
    beneficiarioNombre:     row.beneficiario_nombregiros,
    beneficiarioFechaNac:   row.beneficiario_fecha_nacgiros,
    beneficiarioPais:       row.beneficiario_paisgiros,
    beneficiarioEstado:     row.beneficiario_estadogiros,
    beneficiarioCiudad:     row.beneficiario_ciudadgiros,
    sucursalBeneficiarioId: row.sucursales_idsucursales_beneficiario,
    beneficiarioDireccion:  row.beneficiario_direcciongiros,
    beneficiarioTelefono:   row.beneficiario_telefonogiros,
    beneficiarioMensaje:    row.beneficiario_mensajegiros,
    montoCop:               Number(row.monto_copgiros),
    fleteCop:               Number(row.flete_copgiros),
    fleteAsumidoPor:        row.flete_asumido_porgiros as FleteAsumidoPor | null,
    montoTotalCop:          Number(row.monto_total_copgiros),
    montoDestino:           row.monto_destinogiros !== null ? Number(row.monto_destinogiros) : null,
    monedaDestino:          row.moneda_destinogiros,
    tasaCambio:             row.tasa_cambiogiros !== null ? Number(row.tasa_cambiogiros) : null,
    pin:                    row.pingiros,
    numeroReferencia:       row.numero_referenciagiros,
    referenciaProveedor:    row.referencia_proveedorgiros,
    consultaInspektor:      row.consulta_inspektorgiros,
    resultadoInspektor:     row.resultado_inspektorgiros as ResultadoInspektor | null,
    inspektorReferencia:    row.inspektor_referenciagiros,
    estado:                 row.estadogiros as EstadoGiro,
    formulario5:            row.formulario_5giros,
    declaracionOrigen:      row.declaracion_origengiros,
    fotocopiaCedula:        row.fotocopia_cedulagiros,
    reportadoMintic:        row.reportado_minticgiros,
    createdAt:              row.created_atgiros,
    updatedAt:              row.updated_atgiros,
  };
}

const TABLA_FLETES_NACIONAL = [
  { valorMin: '0',       valorMax: '100000',  flete: '4700'  },
  { valorMin: '100001',  valorMax: '500000',  flete: '8500'  },
  { valorMin: '500001',  valorMax: '1000000', flete: '12000' },
  { valorMin: '1000001', valorMax: '2000000', flete: '18000' },
];

@Injectable()
export class PrismaGirosRepository implements IGirosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearGiroNacional(data: ICrearGiroNacionalData): Promise<GiroEntity> {
    const row = await this.prisma.giro.create({
      data: {
        tipogiros:                     'nacional',
        operaciongiros:                'emision',
        sucursales_idsucursales:       data.sucursalId,
        sesiones_caja_idsesiones_caja: data.sesionCajaId,
        usuarios_idusuarios:           data.usuarioId,
        clientes_idclientes_remitente: data.clienteRemitenteId ?? null,
        remitente_tipo_docgiros:       data.remitenteTipoDoc ?? null,
        remitente_numero_docgiros:     data.remitenteNumeroDoc ?? null,
        remitente_nombregiros:         data.remitenteNombre ?? null,
        remitente_fecha_exp_docgiros:  data.remitenteFechaExpDoc ?? null,
        remitente_ciudadgiros:         data.remitenteCiudad ?? null,
        remitente_direcciongiros:      data.remitenteDireccion ?? null,
        remitente_emailgiros:          data.remitenteEmail ?? null,
        remitente_huellagiros:         data.remitenteHuella ?? false,
        beneficiario_tipo_docgiros:    data.beneficiarioTipoDoc ?? null,
        beneficiario_numero_docgiros:  data.beneficiarioNumeroDoc ?? null,
        beneficiario_nombregiros:      data.beneficiarioNombre ?? null,
        beneficiario_ciudadgiros:      data.beneficiarioCiudad ?? null,
        beneficiario_direcciongiros:   data.beneficiarioDireccion ?? null,
        beneficiario_telefonogiros:    data.beneficiarioTelefono ?? null,
        beneficiario_mensajegiros:     data.beneficiarioMensaje ?? null,
        beneficiario_huellagiros:      data.beneficiarioHuella ?? false,
        beneficiario_pepgiros:         data.beneficiarioPep ?? false,
        monto_copgiros:                data.montoCop,
        flete_copgiros:                data.fleteCop,
        flete_asumido_porgiros:        data.fleteAsumidoPor ?? null,
        monto_total_copgiros:          data.montoTotalCop,
        pingiros:                      data.pin,
        estadogiros:                   'pendiente',
      },
      select: SELECT_GIRO,
    });
    return toGiroEntity(row);
  }

  async crearGiroInternacional(data: ICrearGiroInternacionalData): Promise<GiroEntity> {
    const row = await this.prisma.giro.create({
      data: {
        tipogiros:                     data.tipo,
        operaciongiros:                'emision',
        sucursales_idsucursales:       data.sucursalId,
        sesiones_caja_idsesiones_caja: data.sesionCajaId,
        usuarios_idusuarios:           data.usuarioId,
        remitente_tipo_docgiros:       data.remitenteTipoDoc ?? null,
        remitente_numero_docgiros:     data.remitenteNumeroDoc ?? null,
        remitente_nombregiros:         data.remitenteNombre ?? null,
        remitente_ciudadgiros:         data.remitenteCiudad ?? null,
        remitente_emailgiros:          data.remitenteEmail ?? null,
        remitente_huellagiros:         data.remitenteHuella ?? false,
        beneficiario_tipo_docgiros:    data.beneficiarioTipoDoc ?? null,
        beneficiario_numero_docgiros:  data.beneficiarioNumeroDoc ?? null,
        beneficiario_nombregiros:      data.beneficiarioNombre ?? null,
        beneficiario_fecha_nacgiros:   data.beneficiarioFechaNac ?? null,
        beneficiario_paisgiros:        data.beneficiarioPais ?? 'CO',
        beneficiario_estadogiros:      data.beneficiarioEstado ?? null,
        beneficiario_ciudadgiros:      data.beneficiarioCiudad ?? null,
        beneficiario_direcciongiros:   data.beneficiarioDireccion ?? null,
        beneficiario_telefonogiros:    data.beneficiarioTelefono ?? null,
        beneficiario_huellagiros:      data.beneficiarioHuella ?? false,
        beneficiario_pepgiros:         data.beneficiarioPep ?? false,
        beneficiario_sospechosogiros:  data.beneficiarioSospechoso ?? false,
        monto_copgiros:                data.montoCop,
        monto_total_copgiros:          data.montoTotalCop,
        monto_destinogiros:            data.montoDestino ?? null,
        moneda_destinogiros:           data.monedaDestino ?? 'USD',
        tasa_cambiogiros:              data.tasaCambio ?? null,
        pingiros:                      data.pin ?? null,
        numero_referenciagiros:        data.numeroReferencia ?? null,
        estadogiros:                   'pendiente',
      },
      select: SELECT_GIRO,
    });
    return toGiroEntity(row);
  }

  async findGiroById(id: number): Promise<GiroEntity | null> {
    const row = await this.prisma.giro.findUnique({
      where:  { idgiros: id },
      select: SELECT_GIRO,
    });
    return row ? toGiroEntity(row) : null;
  }

  async findGirosByPinYSucursal(pin: string, sucursalId?: number): Promise<GiroEntity[]> {
    const rows = await this.prisma.giro.findMany({
      where: {
        pingiros:                 pin,
        ...(sucursalId !== undefined ? { sucursales_idsucursales: sucursalId } : {}),
      },
      select: SELECT_GIRO,
    });
    return rows.map(toGiroEntity);
  }

  async findGirosBySesion(sesionId: number): Promise<GiroEntity[]> {
    const rows = await this.prisma.giro.findMany({
      where:  { sesiones_caja_idsesiones_caja: sesionId },
      select: SELECT_GIRO,
      orderBy: { created_atgiros: 'desc' },
    });
    return rows.map(toGiroEntity);
  }

  async pagarGiro(id: number): Promise<GiroEntity> {
    const row = await this.prisma.giro.update({
      where:  { idgiros: id },
      data:   { estadogiros: 'pagado', operaciongiros: 'pago', updated_atgiros: new Date() },
      select: SELECT_GIRO,
    });
    return toGiroEntity(row);
  }

  async anularGiro(id: number): Promise<GiroEntity> {
    const row = await this.prisma.giro.update({
      where:  { idgiros: id },
      data:   { estadogiros: 'anulado', updated_atgiros: new Date() },
      select: SELECT_GIRO,
    });
    return toGiroEntity(row);
  }

  async findPinsExistentes(): Promise<Set<string>> {
    const rows = await this.prisma.giro.findMany({
      where:  { estadogiros: { not: 'anulado' }, pingiros: { not: null } },
      select: { pingiros: true },
    });
    const pins = new Set<string>();
    for (const r of rows) {
      if (r.pingiros !== null) pins.add(r.pingiros);
    }
    return pins;
  }

  async findTablasFletes(_tipo: TipoGiro): Promise<{ valorMin: string; valorMax: string; flete: string }[]> {
    return TABLA_FLETES_NACIONAL;
  }
}
