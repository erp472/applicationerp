import { Module, Global } from '@nestjs/common';
import { PermisosService } from './application/permisos.service.js';
import { PermisosController } from './infrastructure/permisos.controller.js';
import { CanGuard } from '../common/guards/can.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [PermisosController],
  providers: [PermisosService, CanGuard],
  exports: [PermisosService, CanGuard],
})
export class PermisosModule {}
