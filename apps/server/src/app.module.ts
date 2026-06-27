import { Module } from '@nestjs/common';
import { AppController }       from './app.controller.js';
import { AppService }          from './app.service.js';
import { PrismaModule }        from './prisma/prisma.module.js';
import { RedisModule }         from './redis/redis.module.js';
import { AuditModule }         from './audit/audit.module.js';
import { MetricsModule }       from './metrics/metrics.module.js';
import { AuthModule }          from './auth/auth.module.js';
import { UsersModule }         from './users/users.module.js';
import { DevicesModule }       from './devices/devices.module.js';
import { FeatureFlagsModule }  from './feature-flags/feature-flags.module.js';
import { PermisosModule }      from './permisos/permisos.module.js';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    FeatureFlagsModule,   // antes de PermisosModule — CanGuard lo necesita
    AuditModule,
    MetricsModule,
    AuthModule,
    UsersModule,
    DevicesModule,
    PermisosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
