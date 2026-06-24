import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import * as promClient from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Get()
  @ApiExcludeEndpoint()
  async getMetrics(@Res() reply: FastifyReply) {
    const metrics = await promClient.register.metrics();
    void reply.header('Content-Type', promClient.register.contentType).send(metrics);
  }
}
