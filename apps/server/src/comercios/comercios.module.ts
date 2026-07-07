import { Module } from '@nestjs/common';
import { ComerciosService } from './application/comercios.service.js';
import { ComerciosController } from './infrastructure/comercios.controller.js';
import { PrismaComerciosRepository } from './infrastructure/prisma-comercios.repository.js';
import { COMERCIOS_REPOSITORY } from './domain/comercio.repository.js';

@Module({
  controllers: [ComerciosController],
  providers: [
    ComerciosService,
    { provide: COMERCIOS_REPOSITORY, useClass: PrismaComerciosRepository },
  ],
  exports: [ComerciosService],
})
export class ComerciosModule {}
