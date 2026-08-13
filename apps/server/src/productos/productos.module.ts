import { Module } from '@nestjs/common';
import { ProductosService } from './application/productos.service.js';
import { ProductosEspecialesService } from './application/productos-especiales.service.js';
import { ProductosController } from './infrastructure/productos.controller.js';
import { EstampillasAdminController } from './infrastructure/estampillas-admin.controller.js';
import { ProductosEspecialesAdminController } from './infrastructure/productos-especiales-admin.controller.js';
import { PrismaProductosRepository } from './infrastructure/prisma-productos.repository.js';
import { PRODUCTOS_REPOSITORY } from './domain/producto.repository.js';

@Module({
  controllers: [ProductosController, EstampillasAdminController, ProductosEspecialesAdminController],
  providers: [
    ProductosService,
    ProductosEspecialesService,
    { provide: PRODUCTOS_REPOSITORY, useClass: PrismaProductosRepository },
  ],
  exports: [ProductosService],
})
export class ProductosModule {}
