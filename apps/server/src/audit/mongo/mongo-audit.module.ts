import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditEvent, AuditEventSchema } from './audit-event.schema.js';
import { MongoAuditService } from './mongo-audit.service.js';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditEvent.name, schema: AuditEventSchema },
    ]),
  ],
  providers: [MongoAuditService],
  exports:   [MongoAuditService],
})
export class MongoAuditModule {}
