import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CAN_KEY } from '../decorators/can.decorator.js';
import type { CanOpciones } from '../decorators/can.decorator.js';
import { PermisosService } from '../../permisos/application/permisos.service.js';

@Injectable()
export class CanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permisosService: PermisosService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const opciones = this.reflector.getAllAndOverride<CanOpciones | undefined>(CAN_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!opciones) return true;

    const { user } = ctx.switchToHttp().getRequest<{ user: { id: string; rol: string } }>();
    if (!user) return false;

    return this.permisosService.can(user.id, user.rol, opciones);
  }
}
