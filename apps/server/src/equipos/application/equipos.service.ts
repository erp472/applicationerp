import { Injectable, Inject } from '@nestjs/common';
import { EQUIPOS_REPOSITORY } from '../domain/equipo.repository.js';
import type { IEquiposRepository } from '../domain/equipo.repository.js';
import { EquipoNotFoundError } from '../domain/equipo.errors.js';
import {
  validateMacFormat,
  validateMacNotDuplicated,
  validateSucursalExists,
  normalizeMac,
} from '../domain/business-rules.js';
import { CreateEquipoDto } from '../dto/create-equipo.dto.js';
import { UpdateEquipoDto } from '../dto/update-equipo.dto.js';
import { QueryEquipoDto } from '../dto/query-equipo.dto.js';
import { AuditService } from '../../audit/audit.service.js';
import { auditStore } from '../../common/audit-context.js';

@Injectable()
export class EquiposService {
  constructor(
    @Inject(EQUIPOS_REPOSITORY)
    private readonly repo: IEquiposRepository,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateEquipoDto) {
    const normalizedMac = normalizeMac(dto.mac);
    validateMacFormat(normalizedMac);

    const [sucursalOk, macOk] = await Promise.all([
      this.repo.sucursalExists(dto.sucursal_id),
      this.repo.macExists(normalizedMac),
    ]);
    validateSucursalExists(dto.sucursal_id, sucursalOk);
    validateMacNotDuplicated(normalizedMac, macOk);

    const equipo = await this.repo.create({
      sucursalId:       dto.sucursal_id,
      mac:              normalizedMac,
      nombre:           dto.nombre ?? null,
      sistemaOperativo: dto.sistema_operativo ?? null,
    });

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      audit_key:     'ADM-08',
      usuario_id:    userId,
      accion:        'CREATE',
      entidad:       'equipos_autorizados',
      entidad_id:    equipo.id,
      ip_origen:     ip,
      resultado:     'OK',
      datos_despues: { mac: equipo.mac, sucursalId: equipo.sucursalId },
    });

    return equipo;
  }

  async findAll(query: QueryEquipoDto) {
    const { datos, total } = await this.repo.findAll(query);
    const { pagina, limite } = query;
    return {
      datos,
      meta: { total, pagina, limite, paginas: Math.ceil(total / limite) },
    };
  }

  async findOne(id: number) {
    const equipo = await this.repo.findById(id);
    if (!equipo) throw new EquipoNotFoundError(String(id));
    return equipo;
  }

  async update(id: number, dto: UpdateEquipoDto) {
    await this.findOne(id);

    const updated = await this.repo.update(id, {
      nombre:            dto.nombre,
      sistemaOperativo:  dto.sistema_operativo,
      activo:            dto.activo,
    });

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      audit_key:     'ADM-08',
      usuario_id:    userId,
      accion:        'UPDATE',
      entidad:       'equipos_autorizados',
      entidad_id:    id,
      ip_origen:     ip,
      resultado:     'OK',
      datos_despues: dto,
    });

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    const deleted = await this.repo.softDelete(id);

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      audit_key:  'ADM-08',
      usuario_id: userId,
      accion:     'DELETE',
      entidad:    'equipos_autorizados',
      entidad_id: id,
      ip_origen:  ip,
      resultado:  'OK',
    });

    return deleted;
  }
}
