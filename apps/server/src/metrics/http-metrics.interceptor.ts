import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import * as promClient from 'prom-client';

const httpRequestsTotal = new promClient.Counter({
  name: 'pos472_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const httpDuration = new promClient.Histogram({
  name: 'pos472_http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
});

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const method: string = req.method;
    const route: string = req.routeOptions?.url ?? req.url ?? 'unknown';
    const start = Date.now();

    const record = (status: number) => {
      const duration = Date.now() - start;
      const labels = { method, route, status: String(status) };
      httpRequestsTotal.inc(labels);
      httpDuration.observe(labels, duration);
    };

    return next.handle().pipe(
      tap(() => {
        const res = ctx.switchToHttp().getResponse();
        record(res.statusCode ?? 200);
      }),
      catchError((err: unknown) => {
        record(500);
        return throwError(() => err);
      }),
    );
  }
}
