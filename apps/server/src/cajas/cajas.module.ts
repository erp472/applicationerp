import { Module } from '@nestjs/common';
import { CajasService } from './application/cajas.service.js';
import { CajasController } from './infrastructure/cajas.controller.js';
import { PrismaCajasRepository } from './infrastructure/prisma-cajas.repository.js';
import { PrismaSesionesCajaRepository } from './infrastructure/prisma-sesiones-caja.repository.js';
import { CajasScheduler } from './infrastructure/cajas.scheduler.js';
import { CAJAS_REPOSITORY } from './domain/caja.repository.js';
import { SESIONES_CAJA_REPOSITORY } from './domain/sesion-caja.repository.js';

@Module({
  controllers: [CajasController],
  providers: [
    CajasService,
    CajasScheduler,
    { provide: CAJAS_REPOSITORY,        useClass: PrismaCajasRepository },
    { provide: SESIONES_CAJA_REPOSITORY, useClass: PrismaSesionesCajaRepository },
  ],
  exports: [CajasService, SESIONES_CAJA_REPOSITORY],
})
export class CajasModule {}
