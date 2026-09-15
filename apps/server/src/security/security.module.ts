import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SecurityRulesService } from './security-rules.service.js';
import { SecurityController } from './security.controller.js';
import { SecurityAlertMongo, SecurityAlertSchema } from './security-alert.schema.js';

/**
 * SecurityModule — detección de anomalías y alertas de seguridad.
 *
 * MongoAuditService está disponible globalmente vía AuditModule (@Global).
 * RealtimeService está disponible globalmente vía RealtimeModule (@Global).
 * No se necesita importar esos módulos aquí.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SecurityAlertMongo.name, schema: SecurityAlertSchema },
    ]),
  ],
  providers:   [SecurityRulesService],
  controllers: [SecurityController],
  exports:     [SecurityRulesService],
})
export class SecurityModule {}
