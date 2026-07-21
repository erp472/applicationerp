import { Module } from '@nestjs/common';
import { ClientesService } from './application/clientes.service.js';
import { ClientesController } from './infrastructure/clientes.controller.js';
import { PrismaClientesRepository } from './infrastructure/prisma-clientes.repository.js';
import { PrismaTipoClienteRepository } from './infrastructure/prisma-tipo-cliente.repository.js';
import { CLIENTE_REPOSITORY } from './domain/cliente.repository.js';
import { TIPO_CLIENTE_REPOSITORY } from './domain/tipo-cliente.repository.js';

@Module({
  controllers: [ClientesController],
  providers: [
    ClientesService,
    { provide: CLIENTE_REPOSITORY,      useClass: PrismaClientesRepository },
    { provide: TIPO_CLIENTE_REPOSITORY, useClass: PrismaTipoClienteRepository },
  ],
  exports: [ClientesService],
})
export class ClientesModule {}
