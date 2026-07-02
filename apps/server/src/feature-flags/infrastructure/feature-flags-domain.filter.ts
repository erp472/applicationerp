import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { FeatureFlagDomainError } from '../domain/feature-flags.errors.js';

@Catch(FeatureFlagDomainError)
export class FeatureFlagsDomainFilter implements ExceptionFilter {
  catch(exception: FeatureFlagDomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    response.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      message:    exception.message,
      error:      exception.name,
    });
  }
}
