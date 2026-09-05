import { Injectable, Inject } from '@nestjs/common';
import { SUCURSALES_REPOSITORY } from '../domain/sucursal.repository.js';
import type { ISucursalesRepository } from '../domain/sucursal.repository.js';
import { SucursalNotFoundError, SucursalEmailInvalidoError } from '../domain/sucursal.errors.js';
import {
  validateCodigoNotDuplicated,
  validateRegionalExists,
  validateHorario,
  validateSoftDeleteAllowed,
  validateEmailFormat,
  validateCiudadBelongsToDepartamento,
} from '../domain/business-rules.js';
import { CreateSucursalDto } from '../dto/create-sucursal.dto.js';
import { UpdateSucursalDto } from '../dto/update-sucursal.dto.js';
import { QuerySucursalDto } from '../dto/query-sucursal.dto.js';
import { AuditService } from '../../audit/audit.service.js';
import { auditStore } from '../../common/audit-context.js';

@Injectable()
export class SucursalesService {
  constructor(
    @Inject(SUCURSALES_REPOSITORY)
    private readonly repo: ISucursalesRepository,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateSucursalDto) {
    // validaciones sincrónicas primero
    if (!validateEmailFormat(dto.email ?? null)) throw new SucursalEmailInvalidoError(dto.email!);
    validateHorario(dto.horario_apertura ?? null, dto.horario_cierre ?? null);

    // validaciones con acceso a BD en paralelo
    const [regionalOk, byCode] = await Promise.all([
      this.repo.regionalExists(dto.regional_id),
      this.repo.findByCodigo(dto.codigo),
    ]);
    validateRegionalExists(dto.regional_id, regionalOk);
    validateCodigoNotDuplicated(dto.codigo, !!byCode);

    // validación geo: ciudad debe pertenecer al departamento indicado
    if (dto.ciudad_id != null && dto.departamento_id != null) {
      const ciudadDepId = await this.repo.ciudadDepartamentoId(dto.ciudad_id);
      if (ciudadDepId !== null) validateCiudadBelongsToDepartamento(ciudadDepId, dto.departamento_id);
    }

    const sucursal = await this.repo.create({
      regionalId:     dto.regional_id,
      codigo:         dto.codigo,
      nombre:         dto.nombre,
      tipo:           dto.tipo,
      direccion:      dto.direccion ?? null,
      telefono:       dto.telefono ?? null,
      email:          dto.email ?? null,
      horarioApertura: dto.horario_apertura ?? null,
      horarioCierre:  dto.horario_cierre ?? null,
      paisId:         dto.pais_id ?? null,
      departamentoId: dto.departamento_id ?? null,
      ciudadId:       dto.ciudad_id ?? null,
    });

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      audit_key:     'ADM-07',
      usuario_id:    userId,
      accion:        'CREATE',
      entidad:       'sucursales',
      entidad_id:    sucursal.id,
      ip_origen:     ip,
      resultado:     'OK',
      datos_despues: { codigo: sucursal.codigo, nombre: sucursal.nombre, tipo: sucursal.tipo },
    });

    return sucursal;
  }

  async findAll(query: QuerySucursalDto) {
    const { datos, total } = await this.repo.findAll(query);
    const { pagina, limite } = query;
    return {
      datos,
      meta: { total, pagina, limite, paginas: Math.ceil(total / limite) },
    };
  }

  async findOne(id: number) {
    const sucursal = await this.repo.findById(id);
    if (!sucursal) throw new SucursalNotFoundError(String(id));
    return sucursal;
  }

  async update(id: number, dto: UpdateSucursalDto) {
    await this.findOne(id);

    if (dto.email !== undefined && !validateEmailFormat(dto.email)) {
      throw new SucursalEmailInvalidoError(dto.email!);
    }
    validateHorario(dto.horario_apertura ?? null, dto.horario_cierre ?? null);

    if (dto.regional_id !== undefined) {
      validateRegionalExists(dto.regional_id, await this.repo.regionalExists(dto.regional_id));
    }

    if (dto.ciudad_id != null && dto.departamento_id != null) {
      const ciudadDepId = await this.repo.ciudadDepartamentoId(dto.ciudad_id);
      if (ciudadDepId !== null) validateCiudadBelongsToDepartamento(ciudadDepId, dto.departamento_id);
    }

    const updated = await this.repo.update(id, {
      regionalId:      dto.regional_id,
      nombre:          dto.nombre,
      tipo:            dto.tipo,
      direccion:       dto.direccion,
      telefono:        dto.telefono,
      email:           dto.email,
      horarioApertura: dto.horario_apertura,
      horarioCierre:   dto.horario_cierre,
      paisId:          dto.pais_id,
      departamentoId:  dto.departamento_id,
      ciudadId:        dto.ciudad_id,
      activo:          dto.activo,
    });

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      audit_key:     'ADM-07',
      usuario_id:    userId,
      accion:        'UPDATE',
      entidad:       'sucursales',
      entidad_id:    id,
      ip_origen:     ip,
      resultado:     'OK',
      datos_despues: { ...dto, horario_apertura: undefined, horario_cierre: undefined },
    });

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    const activeUsers = await this.repo.countActiveUsers(id);
    validateSoftDeleteAllowed(String(id), activeUsers);

    const deleted = await this.repo.softDelete(id);

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      audit_key:  'ADM-07',
      usuario_id: userId,
      accion:     'DELETE',
      entidad:    'sucursales',
      entidad_id: id,
      ip_origen:  ip,
      resultado:  'OK',
    });

    return deleted;
  }
}
