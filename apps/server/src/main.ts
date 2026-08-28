import 'dotenv/config';
import './otel.js';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { trace } from '@opentelemetry/api';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './app.module.js';
import { ConfigService } from './config/config.service.js';
import { RealtimeService } from './realtime/realtime.service.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: process.env.LOG_LEVEL ?? 'info',
        mixin() {
          const span = trace.getActiveSpan();
          const ctx = span?.spanContext();
          if (!ctx) return {};
          return { trace_id: ctx.traceId, span_id: ctx.spanId };
        },
        ...(process.env.NODE_ENV !== 'production' && {
          transport: { target: 'pino-pretty', options: { colorize: true } },
        }),
      },
    }),
  );

  const config = app.get(ConfigService);

  await app.register(cors, {
    // En dev: permite cualquier origen. En prod: whitelist explícita desde CORS_ORIGIN (comma-separated).
    origin: config.isDev ? true : config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: config.isDev ? false : undefined,
  });

  // 🤓 register @fastify/websocket for /realtime endpoint
  await app.register(fastifyWebsocket);

  const jwtService      = app.get(JwtService);
  const realtimeService = app.get(RealtimeService);

  // JWT auth via ?token= query param then upgrade to WS
  app.getHttpAdapter().getInstance().get(
    '/realtime',
    { websocket: true },
    (socket: import('@fastify/websocket').WebSocket, req: import('fastify').FastifyRequest) => {
      const token = (req.query as Record<string, string>)['token'];
      if (!token) {
        socket.close(4401, 'Unauthorized');
        return;
      }
      try {
        jwtService.verify(token);
      } catch {
        socket.close(4401, 'Invalid token');
        return;
      }
      realtimeService.addClient(socket);
      socket.send(JSON.stringify({ event: 'connection.ack', data: { ts: Date.now() } }));

      socket.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg?.event === 'ping') socket.send(JSON.stringify({ event: 'pong', data: { ts: Date.now() } }));
        } catch { /* ignore malformed frames */ }
      });
    },
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sistema 4-72 POS')
    .setDescription('API del sistema ERP 4-72')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.port, '0.0.0.0');
}

//🤓 send to bootstraping but use vitetest
bootstrap();
