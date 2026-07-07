import { Module } from '@nestjs/common';
import { SucursalesService } from './application/sucursales.service.js';
import { SucursalesController } from './infrastructure/sucursales.controller.js';
import { PrismaSucursalesRepository } from './infrastructure/prisma-sucursales.repository.js';
import { SUCURSALES_REPOSITORY } from './domain/sucursal.repository.js';

@Module({
  controllers: [SucursalesController],
  providers: [
    SucursalesService,
    { provide: SUCURSALES_REPOSITORY, useClass: PrismaSucursalesRepository },
  ],
  exports: [SucursalesService],
})
export class SucursalesModule {}
