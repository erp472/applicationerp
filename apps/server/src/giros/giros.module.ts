import { Module } from '@nestjs/common';
import { GirosService }            from './application/giros.service.js';
import { GirosController }         from './infrastructure/giros.controller.js';
import { PrismaGirosRepository }   from './infrastructure/prisma-giros.repository.js';
import { GIROS_REPOSITORY }        from './domain/giro.repository.js';
import { CajasModule }             from '../cajas/cajas.module.js';

@Module({
  imports:     [CajasModule],
  controllers: [GirosController],
  providers: [
    GirosService,
    { provide: GIROS_REPOSITORY, useClass: PrismaGirosRepository },
  ],
  exports: [GirosService],
})
export class GirosModule {}
