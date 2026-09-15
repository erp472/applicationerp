import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { INVENTARIO_REPOSITORY } from './domain/inventario.repository.js';
import { InventarioService } from './application/inventario.service.js';
import { PrismaInventarioRepository } from './infrastructure/prisma-inventario.repository.js';
import { InventarioController } from './infrastructure/inventario.controller.js';

@Module({
  imports:     [PrismaModule],
  controllers: [InventarioController],
  providers: [
    InventarioService,
    { provide: INVENTARIO_REPOSITORY, useClass: PrismaInventarioRepository },
  ],
  exports: [InventarioService],
})
export class InventarioModule {}
