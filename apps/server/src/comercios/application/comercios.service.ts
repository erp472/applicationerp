import { Injectable, Inject } from '@nestjs/common';
import { COMERCIOS_REPOSITORY } from '../domain/comercio.repository.js';
import type { IComerciosRepository } from '../domain/comercio.repository.js';
import { ComercioNotFoundError } from '../domain/comercio.errors.js';
import {
  validateCodigoNotDuplicated,
  validateNitNotDuplicated,
  validateSoftDeleteAllowed,
  validateNitFormat,
} from '../domain/business-rules.js';
import { CreateComercioDto } from '../dto/create-comercio.dto.js';
import { UpdateComercioDto } from '../dto/update-comercio.dto.js';
import { QueryComercioDto } from '../dto/query-comercio.dto.js';
import { AuditService } from '../../audit/audit.service.js';
import { auditStore } from '../../common/audit-context.js';

@Injectable()
export class ComerciosService {
  constructor(
    @Inject(COMERCIOS_REPOSITORY)
    private readonly repo: IComerciosRepository,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateComercioDto) {
    validateNitFormat(dto.nit);

    const [byCode, byNit] = await Promise.all([
      this.repo.findByCodigo(dto.codigo),
      this.repo.findByNit(dto.nit),
    ]);
    validateCodigoNotDuplicated(dto.codigo, !!byCode);
    validateNitNotDuplicated(dto.nit, !!byNit);

    const comercio = await this.repo.create(dto);

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      usuario_id:    userId,
      accion:        'CREATE',
      entidad:       'comercios',
      entidad_id:    comercio.id,
      ip_origen:     ip,
      resultado:     'OK',
      datos_despues: { codigo: comercio.codigo, nombre: comercio.nombre, nit: comercio.nit },
    });

    return comercio;
  }

  async findAll(query: QueryComercioDto) {
    const { datos, total } = await this.repo.findAll(query);
    const { pagina, limite } = query;
    return {
      datos,
      meta: { total, pagina, limite, paginas: Math.ceil(total / limite) },
    };
  }

  async findOne(id: number) {
    const comercio = await this.repo.findById(id);
    if (!comercio) throw new ComercioNotFoundError(String(id));
    return comercio;
  }

  async update(id: number, dto: UpdateComercioDto) {
    await this.findOne(id);

    if (dto.nit) {
      validateNitFormat(dto.nit);
      const conflict = await this.repo.findByNitExcluding(dto.nit, id);
      validateNitNotDuplicated(dto.nit, !!conflict);
    }

    const updated = await this.repo.update(id, dto);

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      usuario_id:    userId,
      accion:        'UPDATE',
      entidad:       'comercios',
      entidad_id:    id,
      ip_origen:     ip,
      resultado:     'OK',
      datos_despues: dto,
    });

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    const activeRegionales = await this.repo.countActiveRegionales(id);
    validateSoftDeleteAllowed(String(id), activeRegionales);

    const deleted = await this.repo.softDelete(id);

    const { userId, ip } = auditStore.getStore() ?? {};
    void this.audit.log({
      usuario_id: userId,
      accion:     'DELETE',
      entidad:    'comercios',
      entidad_id: id,
      ip_origen:  ip,
      resultado:  'OK',
    });

    return deleted;
  }
}
