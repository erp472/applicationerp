import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CAN_KEY } from '../decorators/can.decorator.js';
import type { CanOpciones } from '../decorators/can.decorator.js';
import { AuditService } from '../../audit/audit.service.js';

interface RequestUser {
  id: number;
  rol: string;
  permisos?: string[];
}

/**
 * Regla de negocio: "¿este usuario puede hacer esto?" (rol y/o permiso, lógica OR).
 * No sabe nada de feature flags — eso es FeatureFlagGuard, una regla de negocio
 * distinta (¿está el módulo encendido?). Se combinan apilando ambos guards.
 */
@Injectable()
export class CanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const opciones = this.reflector.getAllAndOverride<CanOpciones | undefined>(CAN_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!opciones) return true;

    const req = ctx.switchToHttp().getRequest();
    const user: RequestUser | undefined = req.user;
    if (!user) return false;

    // ADMIN_SISTEMA ve y accede a todo sin excepción
    if (user.rol === 'ADMIN_SISTEMA') return true;

    const tieneRol     = opciones.rol     ? user.rol === opciones.rol : null;
    const tienePermiso = opciones.permiso ? (user.permisos ?? []).includes(opciones.permiso) : null;

    let permitido: boolean;
    if (opciones.rol && opciones.permiso) permitido = (tieneRol ?? false) || (tienePermiso ?? false);
    else if (opciones.rol)     permitido = tieneRol ?? false;
    else if (opciones.permiso) permitido = tienePermiso ?? false;
    else                        permitido = true;

    if (!permitido) {
      const path = req.url?.split('?')[0] ?? '';
      const entidad = path.split('/').filter(Boolean)[0] ?? 'unknown';
      void this.audit.log({
        audit_key:  'ADM-08',
        usuario_id: user.id,
        accion:     'DENIED',
        entidad,
        ip_origen:  (req.ip ?? req.headers?.['x-forwarded-for']) as string | undefined,
        resultado:  'ERROR',
        error_msg:  `Rol '${user.rol}' sin permiso '${opciones.permiso ?? '-'}' ni rol requerido '${opciones.rol ?? '-'}'`,
      });
    }
    return permitido;
  }
}
