import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ServicioDomainError } from '../domain/servicio.errors.js';

@Catch(ServicioDomainError)
export class ServiciosDomainFilter implements ExceptionFilter {
  catch(exception: ServicioDomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    response.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      message:    exception.message,
      error:      exception.name,
    });
  }
}
