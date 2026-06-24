import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service.js';
import { UsersController } from './infrastructure/users.controller.js';
import { PrismaUsuariosRepository } from './infrastructure/prisma-usuarios.repository.js';
import { PrismaSucursalesRepository } from './infrastructure/prisma-sucursales.repository.js';
import { USUARIOS_REPOSITORY } from './domain/usuarios.repository.js';
import { SUCURSALES_REPOSITORY } from './domain/sucursales.repository.js';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USUARIOS_REPOSITORY, useClass: PrismaUsuariosRepository },
    { provide: SUCURSALES_REPOSITORY, useClass: PrismaSucursalesRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
