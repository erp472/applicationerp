import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ISucursalesRepository } from '../domain/sucursales.repository.js';

@Injectable()
export class PrismaSucursalesRepository implements ISucursalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.sucursal.count({ where: { id, activo: true } });
    return count > 0;
  }
}
