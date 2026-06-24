import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './application/auth.service.js';
import { AuthController } from './infrastructure/auth.controller.js';
import { JwtStrategy } from './infrastructure/jwt.strategy.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    PassportModule,
    AuditModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev_secret_change_in_prod',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
