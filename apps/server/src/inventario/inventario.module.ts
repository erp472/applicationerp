import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventarioService } from './inventario.service.js';
import { InventarioController } from './inventario.controller.js';

@Module({
  imports:     [PrismaModule],
  providers:   [InventarioService],
  controllers: [InventarioController],
  exports:     [InventarioService],
})
export class InventarioModule {}
