import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { AuditController } from './audit.controller.js';
import { AuditInterceptor } from './audit.interceptor.js';
import { MongoAuditModule } from './mongo/mongo-audit.module.js';

@Global()
@Module({
  imports:     [MongoAuditModule],
  controllers: [AuditController],
  providers:   [AuditService, AuditInterceptor],
  exports:     [AuditService, AuditInterceptor, MongoAuditModule],
})
export class AuditModule {}
