import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ProductoDomainError } from '../domain/producto.errors.js';

@Catch(ProductoDomainError)
export class ProductosDomainFilter implements ExceptionFilter {
  catch(exception: ProductoDomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    response.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      message:    exception.message,
      error:      exception.name,
    });
  }
}
