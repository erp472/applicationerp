import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import type { Response } from 'express';
import { ClienteDomainError } from '../domain/cliente.errors.js';

@Catch(ClienteDomainError)
export class ClientesDomainFilter implements ExceptionFilter {
  catch(ex: ClienteDomainError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(ex.statusCode).json({ statusCode: ex.statusCode, message: ex.message, error: ex.name });
  }
}
