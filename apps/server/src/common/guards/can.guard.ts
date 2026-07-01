import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CAN_KEY } from '../decorators/can.decorator.js';
import type { CanOpciones } from '../decorators/can.decorator.js';
import { PermisosService }     from '../../permisos/application/permisos.service.js';
import { FeatureFlagsService } from '../../feature-flags/application/feature-flags.service.js';

@Injectable()
export class CanGuard implements CanActivate {
  constructor(
    private readonly reflector:     Reflector,
    private readonly permisos:      PermisosService,
    private readonly featureFlags:  FeatureFlagsService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const opciones = this.reflector.getAllAndOverride<CanOpciones | undefined>(CAN_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!opciones) return true;

    const { user } = ctx.switchToHttp().getRequest<{ user: { id: string; rol: string } }>();
    if (!user) return false;

    // ADMIN_SISTEMA ve y accede a todo sin excepción
    if (user.rol === 'ADMIN_SISTEMA') return true;

    // 1. Puerta global AND — si el feature está INACTIVO, bloquea a todos los demás
    if (opciones.feature) {
      const flagActivo = await this.featureFlags.isActive(opciones.feature);
      if (!flagActivo) return false;
    }

    // 2. Lógica OR sobre rol y/o permiso
    return this.permisos.can(user.id, user.rol, opciones);
  }
}
