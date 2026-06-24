import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as promClient from 'prom-client';
import { MetricsController } from './metrics.controller.js';
import { HttpMetricsInterceptor } from './http-metrics.interceptor.js';

@Module({
  controllers: [MetricsController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
  ],
})
export class MetricsModule implements OnApplicationBootstrap {
  onApplicationBootstrap() {
    promClient.collectDefaultMetrics({
      prefix: 'pos472_',
      labels: { app: 'pos472-api' },
    });
  }
}
