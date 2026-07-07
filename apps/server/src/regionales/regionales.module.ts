import { Module } from '@nestjs/common';
import { RegionalesService } from './application/regionales.service.js';
import { RegionalesController } from './infrastructure/regionales.controller.js';
import { PrismaRegionalesRepository } from './infrastructure/prisma-regionales.repository.js';
import { REGIONALES_REPOSITORY } from './domain/regional.repository.js';

@Module({
  controllers: [RegionalesController],
  providers: [
    RegionalesService,
    { provide: REGIONALES_REPOSITORY, useClass: PrismaRegionalesRepository },
  ],
  exports: [RegionalesService],
})
export class RegionalesModule {}
