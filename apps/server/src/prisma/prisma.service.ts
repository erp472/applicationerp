import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: InstanceType<typeof PrismaClient>;

  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    this.client = new PrismaClient({ adapter });
  }

  get usuario() { return this.client.usuario; }
  get sucursal() { return this.client.sucursal; }
  get equipoAutorizado() { return this.client.equipoAutorizado; }
  get auditoria() { return this.client.auditoria; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get $transaction(): any { return this.client.$transaction.bind(this.client); }

  async onModuleInit() { await this.client.$connect(); }
  async onModuleDestroy() { await this.client.$disconnect(); }
}
