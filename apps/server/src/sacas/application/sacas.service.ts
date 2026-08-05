import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SACAS_REPOSITORY } from '../domain/saca.repository.js';
import type { ISacasRepository, CreateSacaData } from '../domain/saca.repository.js';
import { SacaNoEncontradaError, SacaCerradaError, EnvioYaEnSacaError, EnvioNoEncontradoSacaError } from '../domain/saca.errors.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SacasService {
  constructor(
    @Inject(SACAS_REPOSITORY)
    private readonly repo: ISacasRepository,
    private readonly prisma: PrismaService,
  ) {}

  async crear(data: CreateSacaData) {
    return this.repo.create(data);
  }

  async agregarEnvio(sacaId: number, envioId: number) {
    const saca = await this.repo.findById(sacaId);
    if (!saca) throw new NotFoundException(`Saca #${sacaId} no encontrada`);
    if (saca.estado === 'cerrada') throw new ConflictException(`Saca #${sacaId} ya está cerrada`);

    const envio = await this.prisma.envio.findUnique({ where: { idenvios: envioId } });
    if (!envio) throw new NotFoundException(`Envío #${envioId} no encontrado`);

    const yaEnSaca = await this.repo.envioEnSaca(envioId);
    if (yaEnSaca) throw new ConflictException(`Envío #${envioId} ya pertenece a una saca`);

    await this.repo.addEnvio(sacaId, envioId);
    return this.repo.findById(sacaId);
  }

  async cerrar(sacaId: number, dto: { pesoKg?: number; transportistaNombre?: string; fechaDespacho?: string }) {
    const saca = await this.repo.findById(sacaId);
    if (!saca) throw new NotFoundException(`Saca #${sacaId} no encontrada`);
    if (saca.estado === 'cerrada') throw new ConflictException(`Saca #${sacaId} ya está cerrada`);

    const fechaDespacho = dto.fechaDespacho ? new Date(dto.fechaDespacho) : undefined;
    return this.repo.cerrar(sacaId, dto.pesoKg, dto.transportistaNombre, fechaDespacho);
  }

  async listar(sucursalId: number, estado?: string) {
    return this.repo.findBySucursal(sucursalId, estado);
  }

  async obtener(id: number) {
    const saca = await this.repo.findById(id);
    if (!saca) throw new NotFoundException(`Saca #${id} no encontrada`);
    return saca;
  }
}
