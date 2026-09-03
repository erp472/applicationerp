import { Module } from '@nestjs/common';
import { FranquiciasService } from './application/franquicias.service.js';
import { FranquiciasController } from './infrastructure/franquicias.controller.js';

@Module({
  controllers: [FranquiciasController],
  providers: [FranquiciasService],
  exports: [FranquiciasService],
})
export class FranquiciasModule {}
