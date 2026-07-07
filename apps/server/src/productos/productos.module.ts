import { Module } from '@nestjs/common';
import { ProductosService } from './application/productos.service.js';
import { ProductosController } from './infrastructure/productos.controller.js';
import { PrismaProductosRepository } from './infrastructure/prisma-productos.repository.js';
import { PRODUCTOS_REPOSITORY } from './domain/producto.repository.js';

@Module({
  controllers: [ProductosController],
  providers: [
    ProductosService,
    { provide: PRODUCTOS_REPOSITORY, useClass: PrismaProductosRepository },
  ],
  exports: [ProductosService],
})
export class ProductosModule {}
