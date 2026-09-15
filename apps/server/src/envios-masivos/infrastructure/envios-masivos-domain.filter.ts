import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { EnvioMasivoDomainError } from '../domain/envio-masivo.errors.js';
import { CajaDomainError }        from '../../cajas/domain/caja.errors.js';

type DomainError = EnvioMasivoDomainError | CajaDomainError;

@Catch(EnvioMasivoDomainError, CajaDomainError)
export class EnviosMasivosDomainFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<FastifyReply>();
    res.status(exception.statusCode).send({
      statusCode: exception.statusCode,
      error:      exception.name,
      message:    exception.message,
    });
  }
}
