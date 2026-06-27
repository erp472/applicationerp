import { Module, Global } from '@nestjs/common';
import { FeatureFlagsService }    from './application/feature-flags.service.js';
import { FeatureFlagsController } from './infrastructure/feature-flags.controller.js';
import { PrismaModule }           from '../prisma/prisma.module.js';

@Global()
@Module({
  imports:     [PrismaModule],
  controllers: [FeatureFlagsController],
  providers:   [FeatureFlagsService],
  exports:     [FeatureFlagsService],
})
export class FeatureFlagsModule {}
