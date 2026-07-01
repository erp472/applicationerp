import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IBranchesRepository } from '../domain/branches.repository.js';

@Injectable()
export class PrismaBranchesRepository implements IBranchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsById(id: number): Promise<boolean> {
    const count = await this.prisma.sucursal.count({ where: { idsucursales: id, activosucursales: true } });
    return count > 0;
  }
}
