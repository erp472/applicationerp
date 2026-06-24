import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({ imports: [PrismaModule], controllers: [DevicesController] })
export class DevicesModule {}
