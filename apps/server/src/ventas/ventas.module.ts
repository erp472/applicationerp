import { Module } from '@nestjs/common';
import { VentasService }               from './application/ventas.service.js';
import { VentasController }            from './infrastructure/ventas.controller.js';
import { PrismaVentasRepository }      from './infrastructure/prisma-ventas.repository.js';
import { VentasScheduler }             from './infrastructure/ventas.scheduler.js';
import { VENTAS_REPOSITORY }           from './domain/venta.repository.js';
import { CajasModule }                 from '../cajas/cajas.module.js';
import { InventarioModule }            from '../inventario/inventario.module.js';
import { RealtimeModule }              from '../realtime/realtime.module.js';
import { StorageService }              from '../storage/storage.service.js';

@Module({
  imports:     [CajasModule, InventarioModule, RealtimeModule],
  controllers: [VentasController],
  providers: [
    VentasService,
    { provide: VENTAS_REPOSITORY, useClass: PrismaVentasRepository },
    StorageService,
    VentasScheduler,
  ],
  exports: [VentasService],
})
export class VentasModule {}
