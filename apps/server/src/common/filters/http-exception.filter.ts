import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx   = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Error interno del servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resp = exception.getResponse();

      if (typeof resp === 'string') {
        message = resp;
        error   = exception.name;
      } else {
        const r = resp as Record<string, unknown>;
        message = r['message'] ?? resp;
        error   = (r['error'] as string | undefined) ?? exception.name;
      }
    }

    if (statusCode >= 500) {
      this.logger.error(
        { err: exception instanceof Error ? exception.stack : exception },
        typeof message === 'string' ? message : 'Unhandled error',
      );
    }

    reply.status(statusCode).send({ statusCode, message, error });
  }
}
