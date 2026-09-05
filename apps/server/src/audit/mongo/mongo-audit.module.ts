import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditEvent, AuditEventSchema } from './audit-event.schema.js';
import { DbChange, DbChangeSchema } from './db-change.schema.js';
import { MongoAuditService } from './mongo-audit.service.js';
import { MongoDbChangesService } from './mongo-db-changes.service.js';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditEvent.name, schema: AuditEventSchema },
      { name: DbChange.name,   schema: DbChangeSchema },
    ]),
  ],
  providers: [MongoAuditService, MongoDbChangesService],
  exports:   [MongoAuditService, MongoDbChangesService],
})
export class MongoAuditModule {}
