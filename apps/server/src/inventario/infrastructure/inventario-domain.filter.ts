import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { InventarioDomainError } from '../domain/inventario.errors.js';

@Catch(InventarioDomainError)
export class InventarioDomainFilter extends BaseExceptionFilter {
  catch(exception: InventarioDomainError, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const res  = http.getResponse<{ status: (code: number) => { json: (body: object) => void } }>();
    const status = exception.statusCode === 409 ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
    res.status(status).json({ statusCode: status, message: exception.message, error: exception.name });
  }
}
