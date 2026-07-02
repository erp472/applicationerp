import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuditModule } from './audit/audit.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DevicesModule } from './devices/devices.module.js';
import { PermisosModule } from './permisos/permisos.module.js';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module.js';
import { AuditContextInterceptor } from './common/interceptors/audit-context.interceptor.js';

@Module({
  imports: [PrismaModule, AuditModule, MetricsModule, AuthModule, UsersModule, DevicesModule, PermisosModule, FeatureFlagsModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: AuditContextInterceptor },
  ],
})
export class AppModule {}
