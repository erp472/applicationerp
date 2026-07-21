import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { VentaDomainError } from '../domain/venta.errors.js';

@Catch(VentaDomainError)
export class VentasDomainFilter implements ExceptionFilter {
  catch(exception: VentaDomainError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      error:      exception.name,
      message:    exception.message,
    });
  }
}
