import 'dotenv/config';
import './otel.js';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { trace } from '@opentelemetry/api';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const isDev = process.env.NODE_ENV !== 'production';

  // 🤓 active this FastifyApplication then visibility the factory and server to create logger
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
        ...(isDev && { transport: { target: 'pino-pretty', options: { colorize: true } } }),
      },
    }),
  );

  // 🤓 connect all origins with all methods in cors
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 🤓 active helmet
  await app.register(helmet, {
    contentSecurityPolicy: isDev ? false : undefined,
  });

  // 🤓 active swagger increase version with next release
  const config = new DocumentBuilder()
    .setTitle('Sistema 4-72 POS')
    .setDescription('API del sistema ERP 4-72')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

//🤓 send to bootstraping but use vitetest
bootstrap();
