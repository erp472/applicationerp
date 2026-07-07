import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IProductosRepository } from '../domain/producto.repository.js';
import type { ProductoEntity, ProductoSucursalEntity } from '../domain/producto.entity.js';
import type { QueryProductoDto } from '../dto/query-producto.dto.js';

const SELECT = {
  idproductos:                 true,
  codigoproductos:             true,
  nombreproductos:             true,
  descripcionproductos:        true,
  tipoproductos:               true,
  precioproductos:             true,
  precio_sin_taxproductos:     true,
  porcentaje_taxproductos:     true,
  pesoproductos:               true,
  factor_volumetricoproductos: true,
  imagen_urlproductos:         true,
  activoproductos:             true,
  created_atproductos:         true,
  updated_atproductos:         true,
} satisfies Prisma.ProductoSelect;

type ProductoRow = Prisma.ProductoGetPayload<{ select: typeof SELECT }>;

const SELECT_PS = {
  sucursales_idsucursales:  true,
  productos_idproductos:    true,
  activoproductos_sucursal: true,
  sucursal: {
    select: { idsucursales: true, codigosucursales: true, nombresucursales: true },
  },
} satisfies Prisma.ProductoSucursalSelect;

type ProductoSucursalRow = Prisma.ProductoSucursalGetPayload<{ select: typeof SELECT_PS }>;

function toEntity(row: ProductoRow): ProductoEntity {
  return {
    id:               row.idproductos,
    codigo:           row.codigoproductos,
    nombre:           row.nombreproductos,
    descripcion:      row.descripcionproductos ?? null,
    tipo:             row.tipoproductos as ProductoEntity['tipo'],
    precio:           Number(row.precioproductos),
    precioSinTax:     row.precio_sin_taxproductos !== null ? Number(row.precio_sin_taxproductos) : null,
    porcentajeTax:    Number(row.porcentaje_taxproductos),
    peso:             row.pesoproductos !== null ? Number(row.pesoproductos) : null,
    factorVolumetrico: row.factor_volumetricoproductos !== null ? Number(row.factor_volumetricoproductos) : null,
    imagenUrl:        row.imagen_urlproductos ?? null,
    activo:           row.activoproductos,
    createdAt:        row.created_atproductos,
    updatedAt:        row.updated_atproductos,
  };
}

function toSucursalEntity(row: ProductoSucursalRow): ProductoSucursalEntity {
  return {
    sucursalId: row.sucursales_idsucursales,
    productoId: row.productos_idproductos,
    activo:     row.activoproductos_sucursal,
    sucursal: {
      id:     row.sucursal.idsucursales,
      codigo: row.sucursal.codigosucursales,
      nombre: row.sucursal.nombresucursales,
    },
  };
}

@Injectable()
export class PrismaProductosRepository implements IProductosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Parameters<IProductosRepository['create']>[0]): Promise<ProductoEntity> {
    const row = await this.prisma.producto.create({
      data: {
        codigoproductos:             data.codigo,
        nombreproductos:             data.nombre,
        descripcionproductos:        data.descripcion ?? null,
        tipoproductos:               data.tipo as any,
        precioproductos:             data.precio,
        porcentaje_taxproductos:     data.porcentajeTax,
        precio_sin_taxproductos:     data.precioSinTax ?? null,
        pesoproductos:               data.peso ?? null,
        factor_volumetricoproductos: data.factorVolumetrico ?? null,
        imagen_urlproductos:         data.imagenUrl ?? null,
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async findAll(query: QueryProductoDto): Promise<{ datos: ProductoEntity[]; total: number }> {
    const { tipo, activo, buscar, pagina, limite } = query;
    const skip = (pagina - 1) * limite;

    const where: Prisma.ProductoWhereInput = {
      deleted_atproductos: null,
      ...(tipo   !== undefined && { tipoproductos:   tipo }),
      ...(activo !== undefined && { activoproductos: activo }),
      ...(buscar && {
        OR: [
          { codigoproductos:  { contains: buscar, mode: 'insensitive' } },
          { nombreproductos:  { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.producto.count({ where }),
      this.prisma.producto.findMany({
        where, select: SELECT, orderBy: { created_atproductos: 'desc' }, skip, take: limite,
      }),
    ]);

    return { datos: rows.map(toEntity), total };
  }

  async findById(id: number): Promise<ProductoEntity | null> {
    const row = await this.prisma.producto.findFirst({
      where: { idproductos: id, deleted_atproductos: null }, select: SELECT,
    });
    return row ? toEntity(row) : null;
  }

  async codigoExists(codigo: string): Promise<boolean> {
    const count = await this.prisma.producto.count({
      where: { codigoproductos: codigo, deleted_atproductos: null },
    });
    return count > 0;
  }

  async update(id: number, data: Parameters<IProductosRepository['update']>[1]): Promise<ProductoEntity> {
    const row = await this.prisma.producto.update({
      where: { idproductos: id },
      data: {
        ...(data.nombre            !== undefined && { nombreproductos:             data.nombre }),
        ...(data.descripcion       !== undefined && { descripcionproductos:        data.descripcion }),
        ...(data.precio            !== undefined && { precioproductos:             data.precio }),
        ...(data.porcentajeTax     !== undefined && { porcentaje_taxproductos:     data.porcentajeTax }),
        ...(data.precioSinTax      !== undefined && { precio_sin_taxproductos:     data.precioSinTax }),
        ...(data.peso              !== undefined && { pesoproductos:               data.peso }),
        ...(data.factorVolumetrico !== undefined && { factor_volumetricoproductos: data.factorVolumetrico }),
        ...(data.imagenUrl         !== undefined && { imagen_urlproductos:         data.imagenUrl }),
        ...(data.activo            !== undefined && { activoproductos:             data.activo }),
        updated_atproductos: new Date(),
      },
      select: SELECT,
    });
    return toEntity(row);
  }

  async softDelete(id: number): Promise<ProductoEntity> {
    const row = await this.prisma.producto.update({
      where: { idproductos: id },
      data:  { activoproductos: false, deleted_atproductos: new Date(), updated_atproductos: new Date() },
      select: SELECT,
    });
    return toEntity(row);
  }

  async assignSucursal(productoId: number, sucursalId: number): Promise<ProductoSucursalEntity> {
    const row = await this.prisma.productoSucursal.create({
      data: { productos_idproductos: productoId, sucursales_idsucursales: sucursalId },
      select: SELECT_PS,
    });
    return toSucursalEntity(row);
  }

  async unassignSucursal(productoId: number, sucursalId: number): Promise<void> {
    await this.prisma.productoSucursal.delete({
      where: {
        sucursales_idsucursales_productos_idproductos: {
          sucursales_idsucursales: sucursalId,
          productos_idproductos:   productoId,
        },
      },
    });
  }

  async findSucursalesByProducto(productoId: number): Promise<ProductoSucursalEntity[]> {
    const rows = await this.prisma.productoSucursal.findMany({
      where:   { productos_idproductos: productoId, activoproductos_sucursal: true },
      select:  SELECT_PS,
      orderBy: { sucursal: { nombresucursales: 'asc' } },
    });
    return rows.map(toSucursalEntity);
  }

  async sucursalExists(sucursalId: number): Promise<boolean> {
    const count = await this.prisma.sucursal.count({
      where: { idsucursales: sucursalId, deleted_atsucursales: null },
    });
    return count > 0;
  }

  async isAssigned(productoId: number, sucursalId: number): Promise<boolean> {
    const count = await this.prisma.productoSucursal.count({
      where: { productos_idproductos: productoId, sucursales_idsucursales: sucursalId },
    });
    return count > 0;
  }
}
