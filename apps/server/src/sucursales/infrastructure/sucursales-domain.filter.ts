import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { SucursalDomainError } from '../domain/sucursal.errors.js';

@Catch(SucursalDomainError)
export class SucursalesDomainFilter implements ExceptionFilter {
  catch(exception: SucursalDomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    response.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      message:    exception.message,
      error:      exception.name,
    });
  }
}
