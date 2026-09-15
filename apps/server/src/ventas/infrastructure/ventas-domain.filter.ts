import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { VentaDomainError } from '../domain/venta.errors.js';

@Catch(VentaDomainError)
export class VentasDomainFilter implements ExceptionFilter {
  catch(exception: VentaDomainError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<FastifyReply>();
    res.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      error:      exception.name,
      message:    exception.message,
    });
  }
}
