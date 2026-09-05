import { Module } from '@nestjs/common';
import { TesoreriaService } from './application/tesoreria.service.js';
import { TesoreriaController } from './infrastructure/tesoreria.controller.js';
import { CajasModule } from '../cajas/cajas.module.js';

@Module({
  imports: [CajasModule],
  controllers: [TesoreriaController],
  providers: [TesoreriaService],
  exports: [TesoreriaService],
})
export class TesoreriaModule {}
