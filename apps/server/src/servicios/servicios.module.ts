import { Module } from '@nestjs/common';
import { ServiciosService } from './application/servicios.service.js';
import { ServiciosController } from './infrastructure/servicios.controller.js';
import { PrismaServiciosRepository } from './infrastructure/prisma-servicios.repository.js';
import { SERVICIOS_REPOSITORY } from './domain/servicio.repository.js';

@Module({
  controllers: [ServiciosController],
  providers: [
    ServiciosService,
    { provide: SERVICIOS_REPOSITORY, useClass: PrismaServiciosRepository },
  ],
  exports: [ServiciosService],
})
export class ServiciosModule {}
