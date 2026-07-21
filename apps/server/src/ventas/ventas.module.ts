import { Module } from '@nestjs/common';
import { VentasService }               from './application/ventas.service.js';
import { VentasController }            from './infrastructure/ventas.controller.js';
import { PrismaVentasRepository }      from './infrastructure/prisma-ventas.repository.js';
import { VENTAS_REPOSITORY }           from './domain/venta.repository.js';
import { CajasModule }                 from '../cajas/cajas.module.js';

@Module({
  imports:     [CajasModule],
  controllers: [VentasController],
  providers: [
    VentasService,
    { provide: VENTAS_REPOSITORY, useClass: PrismaVentasRepository },
  ],
  exports: [VentasService],
})
export class VentasModule {}
