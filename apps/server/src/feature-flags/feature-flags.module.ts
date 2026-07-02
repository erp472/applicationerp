import { Global, Module } from '@nestjs/common';
import { FeatureFlagsController } from './infrastructure/feature-flags.controller.js';
import { FeatureFlagsService } from './application/feature-flags.service.js';
import { PrismaFeatureFlagsRepository } from './infrastructure/prisma-feature-flags.repository.js';
import { FEATURE_FLAGS_REPOSITORY } from './domain/feature-flags.repository.js';

@Global()
@Module({
  controllers: [FeatureFlagsController],
  providers: [
    FeatureFlagsService,
    { provide: FEATURE_FLAGS_REPOSITORY, useClass: PrismaFeatureFlagsRepository },
  ],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
