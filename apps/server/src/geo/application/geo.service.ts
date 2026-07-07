import { Injectable, Inject } from '@nestjs/common';
import { GEO_REPOSITORY } from '../domain/geo.repository.js';
import type { IGeoRepository } from '../domain/geo.repository.js';

@Injectable()
export class GeoService {
  constructor(
    @Inject(GEO_REPOSITORY)
    private readonly repo: IGeoRepository,
  ) {}

  findAllPaises() {
    return this.repo.findAllPaises();
  }

  findDepartamentosByPais(paisId: number) {
    return this.repo.findDepartamentosByPais(paisId);
  }

  findCiudadesByDepartamento(departamentoId: number) {
    return this.repo.findCiudadesByDepartamento(departamentoId);
  }
}
