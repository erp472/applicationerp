import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { auditStore } from '../audit-context.js';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req  = ctx.switchToHttp().getRequest();
    const user = req.user as { sub?: number } | undefined;
    const ip   = (req.ip ?? req.headers?.['x-forwarded-for'] ?? '') as string;

    return new Observable(subscriber => {
      auditStore.run({ userId: user?.sub, ip }, () => {
        next.handle().subscribe({
          next:     v => subscriber.next(v),
          error:    e => subscriber.error(e),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
