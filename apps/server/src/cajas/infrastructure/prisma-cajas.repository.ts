import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ICajasRepository, CreateCajaData, UpdateCajaData, CreateCajaPadreData, UpdateCajaPadreData } from '../domain/caja.repository.js';
import type { CajaEntity, CajaPadreEntity, AsignacionSucursal, TipoCaja, PerfilUsuario } from '../domain/caja.entity.js';

const SELECT_CAJA = {
  idcajas:                     true,
  sucursales_idsucursales:     true,
  cajas_padres_idcajas_padres: true,
  codigocajas:                 true,
  nombrecajas:                 true,
  tipocajas:                   true,
  base_diacajas:               true,
  limite_alertacajas:          true,
  t_targetcajas:               true,
  activocajas:                 true,
  usuarios_idusuarios_cajero_fijo: true,
} satisfies Prisma.CajaSelect;

type CajaRow = Prisma.CajaGetPayload<{ select: typeof SELECT_CAJA }>;

function toEntity(row: CajaRow): CajaEntity {
  return {
    id:           row.idcajas,
    sucursalId:   row.sucursales_idsucursales,
    cajaPadreId:  row.cajas_padres_idcajas_padres,
    codigo:       row.codigocajas,
    nombre:       row.nombrecajas,
    tipo:         row.tipocajas as CajaEntity['tipo'],
    baseDia:      row.base_diacajas.toString(),
    limiteAlerta: row.limite_alertacajas?.toString() ?? null,
    tTarget:      row.t_targetcajas?.toString() ?? null,
    activo:       row.activocajas,
    cajeroFijoId: row.usuarios_idusuarios_cajero_fijo,
  };
}

const SELECT_PADRE = {
  idcajas_padres:                 true,
  sucursales_idsucursales:        true,
  usuarios_idusuarios_supervisor: true,
  nombrecajas_padres:             true,
  base_generalcajas_padres:       true,
  hora_resetcajas_padres:         true,
  supervisor: {
    select: { idusuarios: true, nombreusuarios: true, emailusuarios: true },
  },
} satisfies Prisma.CajaPadreSelect;

type CajaPadreRow = Prisma.CajaPadreGetPayload<{ select: typeof SELECT_PADRE }>;

function toPadreEntity(row: CajaPadreRow): CajaPadreEntity {
  return {
    id:               row.idcajas_padres,
    sucursalId:       row.sucursales_idsucursales,
    nombre:           row.nombrecajas_padres,
    baseGeneral:      row.base_generalcajas_padres.toString(),
    horaReset:        row.hora_resetcajas_padres,
    supervisorId:     row.supervisor?.idusuarios      ?? null,
    supervisorNombre: row.supervisor?.nombreusuarios  ?? null,
    supervisorEmail:  row.supervisor?.emailusuarios   ?? null,
  };
}

function parseHoraReset(horaReset: string): Date {
  const [h, m] = horaReset.split(':');
  const d = new Date(0);
  d.setUTCHours(+h, +m, 0, 0);
  return d;
}

@Injectable()
export class PrismaCajasRepository implements ICajasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<CajaEntity | null> {
    const row = await this.prisma.caja.findFirst({
      where: { idcajas: id, deleted_atcajas: null },
      select: SELECT_CAJA,
    });
    return row ? toEntity(row) : null;
  }

  async findCajaGeneralByPadre(cajaPadreId: number): Promise<CajaEntity | null> {
    const row = await this.prisma.caja.findFirst({
      where: {
        cajas_padres_idcajas_padres: cajaPadreId,
        tipocajas:                   'general',
        deleted_atcajas:             null,
        activocajas:                 true,
      },
      orderBy: { idcajas: 'asc' },
      select: SELECT_CAJA,
    });
    return row ? toEntity(row) : null;
  }

  // Incluye inactivas: el diagnóstico necesita distinguirlas, no omitirlas.
  async findByPadre(cajaPadreId: number): Promise<CajaEntity[]> {
    const rows = await this.prisma.caja.findMany({
      where:   { cajas_padres_idcajas_padres: cajaPadreId, deleted_atcajas: null },
      orderBy: { idcajas: 'asc' },
      select:  SELECT_CAJA,
    });
    return rows.map(toEntity);
  }

  async findBySucursal(sucursalId: number): Promise<CajaEntity[]> {
    const rows = await this.prisma.caja.findMany({
      where: { sucursales_idsucursales: sucursalId, deleted_atcajas: null, activocajas: true },
      select: SELECT_CAJA,
      orderBy: { codigocajas: 'asc' },
    });
    return rows.map(toEntity);
  }

  async createCaja(data: CreateCajaData): Promise<CajaEntity> {
    const row = await this.prisma.caja.create({
      data: {
        sucursales_idsucursales:     data.sucursalId,
        cajas_padres_idcajas_padres: data.cajaPadreId,
        codigocajas:                 data.codigo,
        nombrecajas:                 data.nombre,
        tipocajas:                   data.tipo,
        base_diacajas:               data.baseDia ?? '0',
        limite_alertacajas:          data.limiteAlerta,
      },
      select: SELECT_CAJA,
    });
    return toEntity(row);
  }

  async updateCaja(id: number, data: UpdateCajaData): Promise<CajaEntity> {
    const row = await this.prisma.caja.update({
      where: { idcajas: id },
      data: {
        ...(data.cajaPadreId  !== undefined && { cajas_padres_idcajas_padres: data.cajaPadreId }),
        ...(data.codigo       !== undefined && { codigocajas:                 data.codigo }),
        ...(data.nombre       !== undefined && { nombrecajas:                 data.nombre }),
        ...(data.tipo         !== undefined && { tipocajas:                   data.tipo }),
        ...(data.baseDia      !== undefined && { base_diacajas:               data.baseDia }),
        ...(data.limiteAlerta !== undefined && { limite_alertacajas:          data.limiteAlerta }),
        ...(data.activo       !== undefined && { activocajas:                 data.activo }),
      },
      select: SELECT_CAJA,
    });
    return toEntity(row);
  }

  async deleteCaja(id: number): Promise<void> {
    await this.prisma.caja.update({
      where: { idcajas: id },
      data: { deleted_atcajas: new Date(), activocajas: false },
    });
  }

  async findAllPadres(): Promise<CajaPadreEntity[]> {
    const rows = await this.prisma.cajaPadre.findMany({
      where: { deleted_atcajas_padres: null },
      select: SELECT_PADRE,
      orderBy: { idcajas_padres: 'asc' },
    });
    return rows.map(toPadreEntity);
  }

  async findPadreById(id: number): Promise<CajaPadreEntity | null> {
    const row = await this.prisma.cajaPadre.findFirst({
      where: { idcajas_padres: id, deleted_atcajas_padres: null },
      select: SELECT_PADRE,
    });
    return row ? toPadreEntity(row) : null;
  }

  async findPadreBySucursal(sucursalId: number): Promise<CajaPadreEntity | null> {
    const row = await this.prisma.cajaPadre.findFirst({
      where: { sucursales_idsucursales: sucursalId, deleted_atcajas_padres: null },
      select: SELECT_PADRE,
    });
    return row ? toPadreEntity(row) : null;
  }

  async createPadre(data: CreateCajaPadreData): Promise<CajaPadreEntity> {
    const row = await this.prisma.cajaPadre.create({
      data: {
        sucursales_idsucursales:  data.sucursalId,
        nombrecajas_padres:       data.nombre,
        base_generalcajas_padres: data.baseGeneral ?? '0',
        hora_resetcajas_padres:   data.horaReset ? parseHoraReset(data.horaReset) : undefined,
      },
      select: SELECT_PADRE,
    });
    return toPadreEntity(row);
  }

  async updatePadre(id: number, data: UpdateCajaPadreData): Promise<CajaPadreEntity> {
    const row = await this.prisma.cajaPadre.update({
      where: { idcajas_padres: id },
      data: {
        ...(data.nombre      && { nombrecajas_padres:       data.nombre }),
        ...(data.baseGeneral && { base_generalcajas_padres: data.baseGeneral }),
        ...(data.horaReset   && { hora_resetcajas_padres:   parseHoraReset(data.horaReset) }),
      },
      select: SELECT_PADRE,
    });
    return toPadreEntity(row);
  }

  async deletePadre(id: number): Promise<void> {
    await this.prisma.cajaPadre.update({
      where: { idcajas_padres: id },
      data: { deleted_atcajas_padres: new Date() },
    });
  }

  async findSucursalRegionalId(sucursalId: number): Promise<number | null> {
    const row = await this.prisma.sucursal.findFirst({
      where:  { idsucursales: sucursalId, deleted_atsucursales: null },
      select: { regionales_idregionales: true },
    });
    return row?.regionales_idregionales ?? null;
  }

  async findAllPadresByRegional(regionalId: number): Promise<CajaPadreEntity[]> {
    const rows = await this.prisma.cajaPadre.findMany({
      where: {
        deleted_atcajas_padres: null,
        sucursal: { regionales_idregionales: regionalId, deleted_atsucursales: null },
      },
      select: SELECT_PADRE,
      orderBy: { idcajas_padres: 'asc' },
    });
    return rows.map(toPadreEntity);
  }

  async findAllPadresBySucursal(sucursalId: number): Promise<CajaPadreEntity[]> {
    const rows = await this.prisma.cajaPadre.findMany({
      where: { sucursales_idsucursales: sucursalId, deleted_atcajas_padres: null },
      select: SELECT_PADRE,
      orderBy: { idcajas_padres: 'asc' },
    });
    return rows.map(toPadreEntity);
  }

  async findPanelAdmin(regionalId?: number) {
    const rows = await this.prisma.sucursal.findMany({
      where: {
        deleted_atsucursales: null,
        ...(regionalId != null && { regionales_idregionales: regionalId }),
      },
      orderBy: { nombresucursales: 'asc' },
      select: {
        idsucursales:     true,
        codigosucursales: true,
        nombresucursales: true,
        tiposucursales:   true,
        regional: { select: { nombreregionales: true } },
        ciudad:   { select: { nombreciudades: true } },
        departamento: { select: { nombredepartamentos: true } },
        cajas: {
          where:   { tipocajas: { in: ['pos', 'pagos'] }, deleted_atcajas: null, activocajas: true },
          orderBy: { codigocajas: 'asc' },
          select: {
            idcajas:     true,
            codigocajas: true,
            nombrecajas: true,
            tipocajas:   true,
            sesiones: {
              where:  { estadosesiones_caja: 'abierta' },
              select: { idsesiones_caja: true },
              take:   1,
            },
          },
        },
        serviciosSucursal: {
          select: {
            activoservicios_sucursal: true,
            servicio: {
              select: {
                idservicios:     true,
                codigoservicios: true,
                nombreservicios: true,
                tiposervicios:   true,
                activoservicios: true,
              },
            },
          },
        },
      },
    });

    return rows.map(s => ({
      sucursalId:   s.idsucursales,
      codigo:       s.codigosucursales,
      nombre:       s.nombresucursales,
      tipo:         s.tiposucursales,
      regional:     s.regional.nombreregionales,
      ciudad:       s.ciudad?.nombreciudades ?? null,
      departamento: s.departamento?.nombredepartamentos ?? null,
      cajas: s.cajas.map(c => ({
        id:           c.idcajas,
        codigo:       c.codigocajas,
        nombre:       c.nombrecajas,
        tipo:         c.tipocajas as TipoCaja,
        sesionActiva: c.sesiones.length > 0,
        sesionId:     c.sesiones[0]?.idsesiones_caja ?? null,
      })),
      servicios: s.serviciosSucursal.map(ss => ({
        id:     ss.servicio.idservicios,
        codigo: ss.servicio.codigoservicios,
        nombre: ss.servicio.nombreservicios,
        tipo:   ss.servicio.tiposervicios,
        activo: ss.activoservicios_sucursal,
      })),
    }));
  }

  async toggleServicioSucursal(sucursalId: number, servicioId: number, activo: boolean): Promise<void> {
    await this.prisma.servicioSucursal.upsert({
      where: {
        sucursales_idsucursales_servicios_idservicios: {
          sucursales_idsucursales: sucursalId,
          servicios_idservicios:   servicioId,
        },
      },
      update: { activoservicios_sucursal: activo },
      create: {
        sucursales_idsucursales: sucursalId,
        servicios_idservicios:   servicioId,
        activoservicios_sucursal: activo,
      },
    });
  }

  async setSupervisorPunto(cajaPadreId: number, supervisorId: number | null): Promise<void> {
    await this.prisma.cajaPadre.update({
      where: { idcajas_padres: cajaPadreId },
      data:  { usuarios_idusuarios_supervisor: supervisorId },
    });
  }

  async getAsignacionSucursal(sucursalId: number): Promise<AsignacionSucursal> {
    const padre = await this.prisma.cajaPadre.findFirst({
      where: { sucursales_idsucursales: sucursalId, deleted_atcajas_padres: null },
      select: {
        idcajas_padres:   true,
        nombrecajas_padres: true,
        supervisor: {
          select: { idusuarios: true, nombreusuarios: true, emailusuarios: true },
        },
        cajas: {
          where: { deleted_atcajas: null, activocajas: true },
          orderBy: { codigocajas: 'asc' },
          select: {
            idcajas:      true,
            codigocajas:  true,
            nombrecajas:  true,
            tipocajas:    true,
            activocajas:  true,
            cajeroFijo:   { select: { idusuarios: true, nombreusuarios: true, emailusuarios: true } },
            sesiones: {
              where:   { estadosesiones_caja: 'abierta' },
              take:    1,
              orderBy: { fecha_aperturasesiones_caja: 'desc' },
              select: {
                idsesiones_caja:             true,
                estadosesiones_caja:         true,
                fecha_aperturasesiones_caja: true,
                usuarioApertura: { select: { idusuarios: true, nombreusuarios: true } },
                cajeroAsignado:  { select: { idusuarios: true, nombreusuarios: true, emailusuarios: true } },
              },
            },
          },
        },
      },
    });

    if (!padre) return { cajaPadreId: null, cajaPadreNombre: null, supervisorId: null, supervisorNombre: null, supervisorEmail: null, cajas: [] };

    return {
      cajaPadreId:      padre.idcajas_padres,
      cajaPadreNombre:  padre.nombrecajas_padres,
      supervisorId:     padre.supervisor?.idusuarios      ?? null,
      supervisorNombre: padre.supervisor?.nombreusuarios  ?? null,
      supervisorEmail:  padre.supervisor?.emailusuarios   ?? null,
      cajas: padre.cajas.map(c => ({
        id:               c.idcajas,
        codigo:           c.codigocajas,
        nombre:           c.nombrecajas,
        tipo:             c.tipocajas as AsignacionSucursal['cajas'][0]['tipo'],
        activo:           c.activocajas,
        cajeroFijoId:     c.cajeroFijo?.idusuarios ?? null,
        cajeroFijoNombre: c.cajeroFijo?.nombreusuarios ?? null,
        cajeroFijoEmail:  c.cajeroFijo?.emailusuarios ?? null,
        sesionActiva: c.sesiones[0] ? {
          sesionId:         c.sesiones[0].idsesiones_caja,
          estado:           c.sesiones[0].estadosesiones_caja as 'abierta',
          supervisorId:     c.sesiones[0].usuarioApertura.idusuarios,
          supervisorNombre: c.sesiones[0].usuarioApertura.nombreusuarios,
          cajeroId:         c.sesiones[0].cajeroAsignado?.idusuarios     ?? c.cajeroFijo?.idusuarios    ?? null,
          cajeroNombre:     c.sesiones[0].cajeroAsignado?.nombreusuarios ?? c.cajeroFijo?.nombreusuarios ?? null,
          cajeroEmail:      c.sesiones[0].cajeroAsignado?.emailusuarios  ?? c.cajeroFijo?.emailusuarios  ?? null,
          fechaApertura:    c.sesiones[0].fecha_aperturasesiones_caja,
        } : null,
      })),
    };
  }

  async findPerfilUsuario(usuarioId: number): Promise<PerfilUsuario | null> {
    const u = await this.prisma.usuario.findFirst({
      where:  { idusuarios: usuarioId, deleted_atusuarios: null, activousuarios: true },
      select: {
        idusuarios:              true,
        nombreusuarios:          true,
        sucursales_idsucursales: true,
        rol: { select: { codigoroles: true } },
      },
    });
    if (!u) return null;
    return {
      id:         u.idusuarios,
      nombre:     u.nombreusuarios,
      rol:        u.rol.codigoroles,
      sucursalId: u.sucursales_idsucursales,
    };
  }

  async setCajeroFijoCaja(cajaId: number, cajeroId: number | null): Promise<void> {
    await this.prisma.caja.update({
      where: { idcajas: cajaId },
      data:  { usuarios_idusuarios_cajero_fijo: cajeroId },
    });
  }
}
