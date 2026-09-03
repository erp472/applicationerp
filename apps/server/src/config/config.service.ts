import { Injectable, Logger } from '@nestjs/common';
import { envSchema, type Env } from './env.schema.js';

@Injectable()
export class ConfigService {
  private readonly env: Env;

  constructor() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const logger = new Logger('ConfigService');
      logger.error('Variables de entorno inválidas:');
      for (const issue of result.error.issues) {
        logger.error(`  ${issue.path.join('.')}: ${issue.message}`);
      }
      process.exit(1);
    }
    this.env = result.data;
  }

  get nodeEnv()    { return this.env.NODE_ENV; }
  get port()       { return this.env.PORT; }
  get logLevel()   { return this.env.LOG_LEVEL; }

  get databaseUrl() { return this.env.DATABASE_URL; }

  get jwtSecret()    { return this.env.JWT_SECRET; }
  get jwtExpiresIn() { return this.env.JWT_EXPIRES_IN; }

  get corsOrigins(): string[] {
    return this.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
  }

  get isProd() { return this.env.NODE_ENV === 'production'; }
  get isDev()  { return this.env.NODE_ENV === 'development'; }

  get redis() {
    return {
      host:     this.env.REDIS_HOST,
      port:     this.env.REDIS_PORT,
      password: this.env.REDIS_PASSWORD,
    };
  }

  get otelEndpoint() { return this.env.OTEL_EXPORTER_OTLP_ENDPOINT; }

  get mongoUri() { return this.env.MONGODB_URI; }
}
