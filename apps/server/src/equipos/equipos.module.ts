import { Module } from '@nestjs/common';
import { EquiposService } from './application/equipos.service.js';
import { EquiposController } from './infrastructure/equipos.controller.js';
import { PrismaEquiposRepository } from './infrastructure/prisma-equipos.repository.js';
import { EQUIPOS_REPOSITORY } from './domain/equipo.repository.js';

@Module({
  controllers: [EquiposController],
  providers: [
    EquiposService,
    { provide: EQUIPOS_REPOSITORY, useClass: PrismaEquiposRepository },
  ],
  exports: [EquiposService],
})
export class EquiposModule {}
