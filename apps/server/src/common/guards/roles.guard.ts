import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { AuditService } from '../../audit/audit.service.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const req = ctx.switchToHttp().getRequest();
    const { user } = req;
    const allowed = required.includes(user?.rol);

    if (!allowed) {
      const path: string = req.url?.split('?')[0] ?? '';
      const entidad = path.split('/').filter(Boolean)[0] ?? 'unknown';

      void this.audit.log({
        usuario_id: user?.id,
        accion:     'DENIED',
        entidad,
        ip_origen:  req.ip ?? req.headers?.['x-forwarded-for'] ?? '',
        resultado:  'ERROR',
        error_msg:  `Rol '${user?.rol ?? 'desconocido'}' intentó una acción restringida a [${required.join(', ')}]`,
      });
    }

    return allowed;
  }
}
