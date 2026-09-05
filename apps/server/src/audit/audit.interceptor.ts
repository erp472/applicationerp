import { Injectable, NestInterceptor, ExecutionContext, CallHandler, OnModuleInit } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuditService } from './audit.service.js';
import type { AuditAction } from './create-audit-log.dto.js';
import { AUDIT_KEY_METADATA, type AuditKeyMeta } from './decorators/audit-key.decorator.js';
import { SecurityRulesService } from '../security/security-rules.service.js';

const SKIP_PATHS = new Set(['/metrics', '/api/docs', '/health']);

const METHOD_TO_ACTION: Record<string, AuditAction> = {
  GET:    'READ',
  POST:   'CREATE',
  PUT:    'UPDATE',
  PATCH:  'UPDATE',
  DELETE: 'DELETE',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor, OnModuleInit {
  private securityRules?: SecurityRulesService;

  constructor(
    private readonly audit: AuditService,
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    try {
      // Lazy resolution — SecurityModule might not be loaded in test environments
      this.securityRules = this.moduleRef.get(SecurityRulesService, { strict: false });
    } catch {
      // no-op: security evaluation is optional
    }
  }

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req  = ctx.switchToHttp().getRequest();
    const path: string = req.url?.split('?')[0] ?? '';

    if (SKIP_PATHS.has(path)) return next.handle();

    const entidad    = path.split('/').filter(Boolean)[0] ?? 'unknown';
    const ip_origen: string = req.ip ?? req.headers?.['x-forwarded-for'] ?? '';
    const usuario_id: number | undefined = (req.user as { id?: number } | undefined)?.id;

    const auditKeyMeta = this.reflector.getAllAndOverride<AuditKeyMeta | undefined>(
      AUDIT_KEY_METADATA,
      [ctx.getHandler(), ctx.getClass()],
    );

    const accion = auditKeyMeta?.accion ?? METHOD_TO_ACTION[req.method as string] ?? 'READ';

    const buildDto = (resultado: 'OK' | 'ERROR', error_msg?: string) => ({
      accion,
      entidad,
      ip_origen,
      resultado,
      usuario_id,
      ...(error_msg && { error_msg }),
      ...(auditKeyMeta && { audit_key: auditKeyMeta.codigo, tipo: auditKeyMeta.tipo }),
    });

    return next.handle().pipe(
      tap(() => {
        const dto = buildDto('OK');
        void this.audit.log(dto);
        void this.securityRules?.evaluate({ ...dto });
      }),
      catchError((err: unknown) => {
        const dto = buildDto('ERROR', err instanceof Error ? err.message : String(err));
        void this.audit.log(dto);
        void this.securityRules?.evaluate({ ...dto });
        return throwError(() => err);
      }),
    );
  }
}
