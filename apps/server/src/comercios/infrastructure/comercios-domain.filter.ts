import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ComercioDomainError } from '../domain/comercio.errors.js';

@Catch(ComercioDomainError)
export class ComerciosDomainFilter implements ExceptionFilter {
  catch(exception: ComercioDomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    response.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      message:    exception.message,
      error:      exception.name,
    });
  }
}
