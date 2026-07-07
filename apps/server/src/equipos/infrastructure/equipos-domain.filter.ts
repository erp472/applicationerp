import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { EquipoDomainError } from '../domain/equipo.errors.js';

@Catch(EquipoDomainError)
export class EquiposDomainFilter implements ExceptionFilter {
  catch(exception: EquipoDomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    response.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      message:    exception.message,
      error:      exception.name,
    });
  }
}
