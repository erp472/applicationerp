import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuditModule } from './audit/audit.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { DevicesModule } from './devices/devices.module.js';

@Module({
  imports: [PrismaModule, AuditModule, MetricsModule, AuthModule, UsersModule, DevicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
