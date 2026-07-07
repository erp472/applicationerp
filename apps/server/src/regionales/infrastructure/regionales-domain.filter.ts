import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { RegionalDomainError } from '../domain/regional.errors.js';

@Catch(RegionalDomainError)
export class RegionalesDomainFilter implements ExceptionFilter {
  catch(exception: RegionalDomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    response.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      message:    exception.message,
      error:      exception.name,
    });
  }
}
