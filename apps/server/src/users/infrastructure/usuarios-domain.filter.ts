import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { UsuarioDomainError } from '../domain/usuario.errors.js';

@Catch(UsuarioDomainError)
export class UsuariosDomainFilter implements ExceptionFilter {
  catch(exception: UsuarioDomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    response.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      message: exception.message,
      error: exception.name,
    });
  }
}
