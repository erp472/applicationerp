import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IGeoRepository } from '../domain/geo.repository.js';
import type { PaisEntity, DepartamentoEntity, CiudadEntity } from '../domain/geo.entity.js';

@Injectable()
export class PrismaGeoRepository implements IGeoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPaises(): Promise<PaisEntity[]> {
    const rows = await this.prisma.pais.findMany({ orderBy: { nombrepaises: 'asc' } });
    return rows.map(r => ({ id: r.idpaises, nombre: r.nombrepaises, iso2: r.iso2 ?? null }));
  }

  async findDepartamentosByPais(paisId: number): Promise<DepartamentoEntity[]> {
    const rows = await this.prisma.departamento.findMany({
      where: { paises_idpaises: paisId },
      orderBy: { nombredepartamentos: 'asc' },
    });
    return rows.map(r => ({
      id:     r.iddepartamentos,
      paisId: r.paises_idpaises,
      nombre: r.nombredepartamentos,
    }));
  }

  async findCiudadesByDepartamento(departamentoId: number): Promise<CiudadEntity[]> {
    const rows = await this.prisma.ciudad.findMany({
      where: { departamentos_iddepartamentos: departamentoId },
      orderBy: { nombreciudades: 'asc' },
    });
    return rows.map(r => ({
      id:             r.idciudades,
      departamentoId: r.departamentos_iddepartamentos,
      nombre:         r.nombreciudades,
    }));
  }
}
