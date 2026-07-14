import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { CajaDomainError } from '../domain/caja.errors.js';

@Catch(CajaDomainError)
export class CajasDomainFilter implements ExceptionFilter {
  catch(exception: CajaDomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    response.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      message:    exception.message,
      error:      exception.name,
    });
  }
}
