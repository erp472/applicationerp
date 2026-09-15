import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LabController } from './lab.controller.js';
import { LabService } from './lab.service.js';
import { LabUserMongo, LabUserSchema } from './lab-user.schema.js';
import { LabSessionMongo, LabSessionSchema } from './lab-session.schema.js';

/**
 * LabModule — entorno de desarrollo aislado con auth propia en MongoDB.
 * Los endpoints /lab/* son públicos (sin JwtAuthGuard del sistema principal).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LabUserMongo.name,    schema: LabUserSchema },
      { name: LabSessionMongo.name, schema: LabSessionSchema },
    ]),
  ],
  controllers: [LabController],
  providers:   [LabService],
  exports:     [LabService],
})
export class LabModule {}
