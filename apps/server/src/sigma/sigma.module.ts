import { Global, Module } from '@nestjs/common';
import { SigmaService } from './sigma.service.js';
import { SigmaController } from './sigma.controller.js';

@Global()
@Module({
  controllers: [SigmaController],
  providers: [SigmaService],
  exports: [SigmaService],
})
export class SigmaModule {}
