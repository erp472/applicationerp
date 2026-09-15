import { Module } from '@nestjs/common';
import { SacasService } from './application/sacas.service.js';
import { SacasController } from './infrastructure/sacas.controller.js';
import { PrismaSacasRepository } from './infrastructure/prisma-sacas.repository.js';
import { SACAS_REPOSITORY } from './domain/saca.repository.js';

@Module({
  controllers: [SacasController],
  providers: [
    SacasService,
    { provide: SACAS_REPOSITORY, useClass: PrismaSacasRepository },
  ],
  exports: [SacasService],
})
export class SacasModule {}
