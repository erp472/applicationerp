import { Module } from '@nestjs/common';
import { CajasModule } from '../cajas/cajas.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RecaudosService } from './application/recaudos.service.js';
import { RecaudosController } from './infrastructure/recaudos.controller.js';
import { PrismaRecaudosRepository } from './infrastructure/prisma-recaudos.repository.js';
import { RECAUDOS_REPOSITORY } from './domain/recaudo.repository.js';

@Module({
  imports: [CajasModule, PrismaModule],
  controllers: [RecaudosController],
  providers: [
    RecaudosService,
    { provide: RECAUDOS_REPOSITORY, useClass: PrismaRecaudosRepository },
  ],
  exports: [RecaudosService],
})
export class RecaudosModule {}
