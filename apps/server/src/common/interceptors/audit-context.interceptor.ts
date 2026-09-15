import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { auditStore } from '../audit-context.js';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req  = ctx.switchToHttp().getRequest();
    // JwtStrategy.validate devuelve { id, ... }; no expone `sub`.
    const user = req.user as { id?: number } | undefined;
    const ip   = (req.ip ?? req.headers?.['x-forwarded-for'] ?? '') as string;

    const store = {
      ...(user?.id !== undefined && { userId: user.id }),
      ip,
      requestId: randomUUID(),
    };

    return new Observable(subscriber => {
      auditStore.run(store, () => {
        next.handle().subscribe({
          next:     v => subscriber.next(v),
          error:    e => subscriber.error(e),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
