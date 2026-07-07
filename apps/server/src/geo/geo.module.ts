import { Module } from '@nestjs/common';
import { GeoService } from './application/geo.service.js';
import { GeoController } from './infrastructure/geo.controller.js';
import { PrismaGeoRepository } from './infrastructure/prisma-geo.repository.js';
import { GEO_REPOSITORY } from './domain/geo.repository.js';

@Module({
  controllers: [GeoController],
  providers: [
    GeoService,
    { provide: GEO_REPOSITORY, useClass: PrismaGeoRepository },
  ],
})
export class GeoModule {}
