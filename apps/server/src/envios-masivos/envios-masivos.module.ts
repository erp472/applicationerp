import { Module } from '@nestjs/common';
import { EnviosMasivosService }    from './application/envios-masivos.service.js';
import { EnviosMasivosController } from './infrastructure/envios-masivos.controller.js';
import { VentasModule }            from '../ventas/ventas.module.js';
import { CajasModule }             from '../cajas/cajas.module.js';
import { StorageService }          from '../storage/storage.service.js';

@Module({
  imports:     [VentasModule, CajasModule],
  controllers: [EnviosMasivosController],
  providers:   [EnviosMasivosService, StorageService],
})
export class EnviosMasivosModule {}
