import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuditService } from './audit.service.js';
import type { AuditAccion } from './create-auditoria.dto.js';

const SKIP_PATHS = new Set(['/metrics', '/api/docs', '/health']);

const METHOD_TO_ACCION: Record<string, AuditAccion> = {
  GET: 'READ',
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const path: string = req.url?.split('?')[0] ?? '';

    if (SKIP_PATHS.has(path)) return next.handle();

    const accion = METHOD_TO_ACCION[req.method as string] ?? 'READ';
    const entidad = path.split('/').filter(Boolean)[0] ?? 'unknown';
    const ip_origen: string = req.ip ?? req.headers?.['x-forwarded-for'] ?? '';

    return next.handle().pipe(
      tap(() => {
        void this.audit.log({ accion, entidad, ip_origen, resultado: 'OK' });
      }),
      catchError((err: unknown) => {
        void this.audit.log({
          accion,
          entidad,
          ip_origen,
          resultado: 'ERROR',
          error_msg: err instanceof Error ? err.message : String(err),
        });
        return throwError(() => err);
      }),
    );
  }
}
