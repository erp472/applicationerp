import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service.js';
import { UsersController } from './infrastructure/users.controller.js';
import { PrismaUsersRepository } from './infrastructure/prisma-users.repository.js';
import { PrismaBranchesRepository } from './infrastructure/prisma-branches.repository.js';
import { USERS_REPOSITORY } from './domain/users.repository.js';
import { BRANCHES_REPOSITORY } from './domain/branches.repository.js';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USERS_REPOSITORY,    useClass: PrismaUsersRepository },
    { provide: BRANCHES_REPOSITORY, useClass: PrismaBranchesRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
