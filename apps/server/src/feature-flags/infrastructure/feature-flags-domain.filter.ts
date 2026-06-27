import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { FeatureFlagsDomainError } from '../domain/feature-flags.errors.js';

@Catch(FeatureFlagsDomainError)
export class FeatureFlagsDomainFilter implements ExceptionFilter {
  catch(err: FeatureFlagsDomainError, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      error: err.name,
    });
  }
}
