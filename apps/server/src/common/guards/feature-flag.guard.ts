import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../decorators/feature.decorator.js';
import { FeatureFlagsService } from '../../feature-flags/application/feature-flags.service.js';
import { AuditService } from '../../audit/audit.service.js';

const NODE_ENV_TO_ENTORNO: Record<string, string> = {
  production: 'prod',
  development: 'dev',
  test: 'dev',
};

interface RequestUser {
  id: number;
  rol: string;
}

/**
 * Regla de negocio: "¿este módulo está encendido?" — nada que ver con permisos.
 * Kill-switch / mantenimiento parcial vía feature flags (con segmentación por
 * rol/usuario). Ver CanGuard para la regla de "¿este usuario puede hacer esto?".
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlags: FeatureFlagsService,
    private readonly audit: AuditService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const codigo = this.reflector.getAllAndOverride<string | undefined>(FEATURE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!codigo) return true;

    const req = ctx.switchToHttp().getRequest();
    const user: RequestUser | undefined = req.user;
    if (!user) return false;

    // ADMIN_SISTEMA siempre puede entrar, incluso con el módulo en mantenimiento
    if (user.rol === 'ADMIN_SISTEMA') return true;

    const entorno = NODE_ENV_TO_ENTORNO[process.env.NODE_ENV ?? 'development'] ?? 'staging';
    const activo = await this.featureFlags.isActive(codigo, entorno, { rol: user.rol, usuarioId: user.id });
    if (activo) return true;

    const path = req.url?.split('?')[0] ?? '';
    const entidad = path.split('/').filter(Boolean)[0] ?? 'unknown';
    void this.audit.log({
      usuario_id: user.id,
      accion:     'DENIED',
      entidad,
      ip_origen:  (req.ip ?? req.headers?.['x-forwarded-for']) as string | undefined,
      resultado:  'ERROR',
      error_msg:  `Módulo '${codigo}' desactivado (mantenimiento o fuera de segmentación) para entorno '${entorno}'`,
    });

    throw new ServiceUnavailableException({
      statusCode: 503,
      error: 'ModuleUnderMaintenance',
      message: `El módulo '${codigo}' está temporalmente desactivado`,
    });
  }
}
