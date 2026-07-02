import { Injectable, Inject } from '@nestjs/common';
import { FEATURE_FLAGS_REPOSITORY } from '../domain/feature-flags.repository.js';
import type { IFeatureFlagsRepository } from '../domain/feature-flags.repository.js';
import {
  FeatureFlagNotFoundError,
  FeatureFlagCodigoDuplicadoError,
} from '../domain/feature-flags.errors.js';
import type { CreateFeatureFlagDto, UpdateFeatureFlagDto } from '../dto/feature-flag.dto.js';
import type { FeatureFlagEntity } from '../domain/feature-flag.entity.js';

export interface EvaluacionContexto {
  rol?: string;
  usuarioId?: number;
}

@Injectable()
export class FeatureFlagsService {
  constructor(
    @Inject(FEATURE_FLAGS_REPOSITORY)
    private readonly repo: IFeatureFlagsRepository,
  ) {}

  findAll(entorno?: string) {
    return this.repo.findAll(entorno);
  }

  async findOne(id: number) {
    const flag = await this.repo.findById(id);
    if (!flag) throw new FeatureFlagNotFoundError(String(id));
    return flag;
  }

  async getActivos(entorno: string, ctx: EvaluacionContexto = {}) {
    const activos = await this.repo.findActivos(entorno);
    return activos.filter((flag) => this.aplicaA(flag, ctx));
  }

  async isActive(codigo: string, entorno: string, ctx: EvaluacionContexto = {}): Promise<boolean> {
    const flag = await this.repo.findByCodigo(codigo);
    if (!flag || !flag.activo) return false;
    if (flag.entorno !== 'all' && flag.entorno !== entorno) return false;
    return this.aplicaA(flag, ctx);
  }

  /** Sin roles/usuarios asociados = aplica a todos. Con segmentación, basta con cumplir una de las dos. */
  private aplicaA(flag: FeatureFlagEntity, ctx: EvaluacionContexto): boolean {
    if (flag.roles.length === 0 && flag.usuarios.length === 0) return true;
    const porRol     = ctx.rol       ? flag.roles.some((r) => r.codigo === ctx.rol) : false;
    const porUsuario = ctx.usuarioId ? flag.usuarios.some((u) => u.id === ctx.usuarioId) : false;
    return porRol || porUsuario;
  }

  async create(dto: CreateFeatureFlagDto) {
    const exists = await this.repo.findByCodigo(dto.codigo);
    if (exists) throw new FeatureFlagCodigoDuplicadoError(dto.codigo);
    return this.repo.create(dto);
  }

  async update(id: number, dto: UpdateFeatureFlagDto) {
    await this.findOne(id);
    return this.repo.update(id, dto);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.remove(id);
    return { id, eliminado: true };
  }

  async asignarRol(featureFlagId: number, rolId: number) {
    await this.findOne(featureFlagId);
    await this.repo.asignarRol(featureFlagId, rolId);
    return this.findOne(featureFlagId);
  }

  async revocarRol(featureFlagId: number, rolId: number) {
    await this.findOne(featureFlagId);
    await this.repo.revocarRol(featureFlagId, rolId);
    return this.findOne(featureFlagId);
  }

  async asignarUsuario(featureFlagId: number, usuarioId: number) {
    await this.findOne(featureFlagId);
    await this.repo.asignarUsuario(featureFlagId, usuarioId);
    return this.findOne(featureFlagId);
  }

  async revocarUsuario(featureFlagId: number, usuarioId: number) {
    await this.findOne(featureFlagId);
    await this.repo.revocarUsuario(featureFlagId, usuarioId);
    return this.findOne(featureFlagId);
  }
}
