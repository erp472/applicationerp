import { Injectable, Inject, OnApplicationBootstrap } from '@nestjs/common';
import type Redis from 'ioredis';
import * as promClient from 'prom-client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { REDIS_CLIENT } from '../../redis/redis.module.js';
import { FeatureFlagModo } from '../domain/feature-flag.entity.js';
import {
  FeatureFlagNotFoundError,
  FeatureFlagNombreDuplicadoError,
} from '../domain/feature-flags.errors.js';
import type { CreateFeatureFlagDto, UpdateFeatureFlagDto } from '../dto/create-feature-flag.dto.js';

const CACHE_TTL = 60; // segundos
const CACHE_KEY = (nombre: string) => `ff:${nombre}`;

const MODO_VALOR: Record<FeatureFlagModo, number> = {
  PRODUCCION: 2,
  AB_TEST:    1,
  INACTIVO:   0,
};

// Gauge global — evitamos re-registrar en hot-reload
const ffGauge: promClient.Gauge<'nombre'> =
  (promClient.register.getSingleMetric('pos472_feature_flag_modo') as promClient.Gauge<'nombre'>) ??
  new promClient.Gauge<'nombre'>({
    name:       'pos472_feature_flag_modo',
    help:       'Estado del feature flag: 2=PRODUCCION 1=AB_TEST 0=INACTIVO',
    labelNames: ['nombre'],
  });

@Injectable()
export class FeatureFlagsService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onApplicationBootstrap() {
    await this.sincronizarMetricas();
  }

  // ─── PUERTA DE ACCESO ──────────────────────────────────────────────────────
  async isActive(nombre: string): Promise<boolean> {
    try {
      const cached = await this.redis.get(CACHE_KEY(nombre));
      if (cached !== null) return cached !== FeatureFlagModo.INACTIVO;
    } catch { /* Redis caído → usar BD */ }

    const flag = await this.prisma.featureFlag.findUnique({ where: { nombre } });
    if (!flag) return false;

    try {
      await this.redis.setex(CACHE_KEY(nombre), CACHE_TTL, flag.modo);
    } catch { /* no crítico */ }

    return flag.modo !== FeatureFlagModo.INACTIVO;
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  findAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) throw new FeatureFlagNotFoundError(id);
    return flag;
  }

  async create(dto: CreateFeatureFlagDto) {
    const existe = await this.prisma.featureFlag.findUnique({ where: { nombre: dto.nombre } });
    if (existe) throw new FeatureFlagNombreDuplicadoError(dto.nombre);

    const flag = await this.prisma.featureFlag.create({ data: dto });
    this.actualizarMetrica(flag.nombre, flag.modo as FeatureFlagModo);
    return flag;
  }

  async update(id: string, dto: UpdateFeatureFlagDto) {
    await this.findOne(id);
    const flag = await this.prisma.featureFlag.update({ where: { id }, data: dto });

    try { await this.redis.del(CACHE_KEY(flag.nombre)); } catch {}
    this.actualizarMetrica(flag.nombre, flag.modo as FeatureFlagModo);
    return flag;
  }

  async remove(id: string) {
    const flag = await this.findOne(id);
    await this.prisma.featureFlag.delete({ where: { id } });

    try { await this.redis.del(CACHE_KEY(flag.nombre)); } catch {}
    ffGauge.remove({ nombre: flag.nombre });
    return { id, eliminado: true };
  }

  // ─── MÉTRICAS ──────────────────────────────────────────────────────────────
  private actualizarMetrica(nombre: string, modo: FeatureFlagModo) {
    ffGauge.set({ nombre }, MODO_VALOR[modo]);
  }

  private async sincronizarMetricas() {
    const flags = await this.prisma.featureFlag.findMany();
    for (const f of flags) {
      this.actualizarMetrica(f.nombre, f.modo as FeatureFlagModo);
    }
  }
}
