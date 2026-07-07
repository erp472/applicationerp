import { Injectable, Inject } from '@nestjs/common';
import { REGIONALES_REPOSITORY } from '../domain/regional.repository.js';
import type { IRegionalesRepository } from '../domain/regional.repository.js';
import { RegionalNotFoundError } from '../domain/regional.errors.js';
import {
  validateCodigoNotDuplicated,
  validateComercioExists,
  validateSoftDeleteAllowed,
  validateDeactivationAllowed,
} from '../domain/business-rules.js';
import { CreateRegionalDto } from '../dto/create-regional.dto.js';
import { UpdateRegionalDto } from '../dto/update-regional.dto.js';
import { QueryRegionalDto } from '../dto/query-regional.dto.js';
import { AuditService } from '../../audit/audit.service.js';
import { auditStore } from '../../common/audit-context.js';

@Injectable()
export class RegionalesService {
  constructor(
    @Inject(REGIONALES_REPOSITORY)
    private readonly repo: IRegionalesRepository,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateRegionalDto) {
    const [comercioOk, byCode] = await Promise.all([
      this.repo.comercioExists(dto.comercio_id),
      this.repo.findByCodigo(dto.codigo),
    ]);
    validateComercioExists(dto.comercio_id, comercioOk);
    validateCodigoNotDuplicated(dto.codigo, !!byCode);

    const regional = await this.repo.create({
      comercioId: dto.comercio_id,
      codigo:     dto.codigo,
      nombre:     dto.nombre,
    });

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      usuario_id:    userId,
      accion:        'CREATE',
      entidad:       'regionales',
      entidad_id:    regional.id,
      ip_origen:     ip,
      resultado:     'OK',
      datos_despues: { codigo: regional.codigo, nombre: regional.nombre, comercioId: regional.comercioId },
    });

    return regional;
  }

  async findAll(query: QueryRegionalDto) {
    const { datos, total } = await this.repo.findAll(query);
    const { pagina, limite } = query;
    return {
      datos,
      meta: { total, pagina, limite, paginas: Math.ceil(total / limite) },
    };
  }

  async findOne(id: number) {
    const regional = await this.repo.findById(id);
    if (!regional) throw new RegionalNotFoundError(String(id));
    return regional;
  }

  async update(id: number, dto: UpdateRegionalDto) {
    await this.findOne(id);

    if (dto.activo === false) {
      const activeSucursales = await this.repo.countActiveSucursales(id);
      validateDeactivationAllowed(String(id), activeSucursales);
    }

    const updated = await this.repo.update(id, dto);

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      usuario_id:    userId,
      accion:        'UPDATE',
      entidad:       'regionales',
      entidad_id:    id,
      ip_origen:     ip,
      resultado:     'OK',
      datos_despues: dto,
    });

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    const activeSucursales = await this.repo.countActiveSucursales(id);
    validateSoftDeleteAllowed(String(id), activeSucursales);

    const deleted = await this.repo.softDelete(id);

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      usuario_id: userId,
      accion:     'DELETE',
      entidad:    'regionales',
      entidad_id: id,
      ip_origen:  ip,
      resultado:  'OK',
    });

    return deleted;
  }
}
