import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { PermisosDomainError } from '../domain/permisos.errors.js';

@Catch(PermisosDomainError)
export class PermisosDomainFilter implements ExceptionFilter {
  catch(err: PermisosDomainError, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      error: err.name,
    });
  }
}
