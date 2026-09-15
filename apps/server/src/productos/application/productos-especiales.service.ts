import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export const PRECIO_MAX_ESPECIAL = 1_000_000;

export interface TarifaEspecialDto {
  minCantidad: number;
  maxCantidad: number | null;
  precio:      number;
}

export interface ProductoEspecialEntity {
  id:              number;
  codigo:          string;
  nombre:          string;
  precio:          number;
  cantidadMinima:  number | null;
  cantidadMaxima:  number | null;
  activo:          boolean;
  createdAt:       Date;
  updatedAt:       Date;
  tarifas:         TarifaEspecialDto[];
}

export interface QueryEspecialDto {
  buscar?:  string;
  activo?:  boolean;
  pagina:   number;
  limite:   number;
}

@Injectable()
export class ProductosEspecialesService {
  constructor(private readonly prisma: PrismaService) {}

  private validatePrecio(precio: number) {
    if (precio > PRECIO_MAX_ESPECIAL) {
      throw new BadRequestException(
        `El precio $${precio.toLocaleString('es-CO')} supera el límite de $1.000.000 COP`,
      );
    }
  }

  private validateTarifas(tarifas: TarifaEspecialDto[]) {
    for (const t of tarifas) {
      if (t.precio > PRECIO_MAX_ESPECIAL) {
        throw new BadRequestException(
          `La tarifa $${t.precio.toLocaleString('es-CO')} supera el límite de $1.000.000 COP`,
        );
      }
      if (t.maxCantidad !== null && t.maxCantidad < t.minCantidad) {
        throw new BadRequestException(
          `maxCantidad (${t.maxCantidad}) no puede ser menor que minCantidad (${t.minCantidad})`,
        );
      }
    }
  }

  private async toEntity(id: number): Promise<ProductoEspecialEntity> {
    const row = await this.prisma.producto.findFirst({
      where: { idproductos: id, tipoproductos: 'otro', deleted_atproductos: null },
    });
    if (!row) throw new NotFoundException(`Producto especial ${id} no encontrado`);
    const tarifas = await this.prisma.tarifaEspecialCantidad.findMany({
      where: {
        productos_idproductos:     id,
        activotarifas_especial:    true,
        deleted_attarifas_especial: null,
      },
      orderBy: { min_cantidadtarifas_especial: 'asc' },
    });
    return {
      id:             row.idproductos,
      codigo:         row.codigoproductos,
      nombre:         row.nombreproductos,
      precio:         Number(row.precioproductos),
      cantidadMinima: row.cantidad_minima_ventaproductos,
      cantidadMaxima: row.cantidad_maxima_ventaproductos,
      activo:         row.activoproductos,
      createdAt:      row.created_atproductos,
      updatedAt:      row.updated_atproductos,
      tarifas: tarifas.map(t => ({
        minCantidad: t.min_cantidadtarifas_especial,
        maxCantidad: t.max_cantidadtarifas_especial ?? null,
        precio:      Number(t.preciotarifas_especial),
      })),
    };
  }

  async findAll(query: QueryEspecialDto) {
    const { buscar, activo, pagina, limite } = query;
    const skip  = (pagina - 1) * limite;
    const where = {
      tipoproductos:       'otro' as const,
      deleted_atproductos: null as null,
      ...(activo !== undefined && { activoproductos: activo }),
      ...(buscar && {
        OR: [
          { codigoproductos: { contains: buscar, mode: 'insensitive' as const } },
          { nombreproductos:  { contains: buscar, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.producto.count({ where }),
      this.prisma.producto.findMany({
        where,
        orderBy: { codigoproductos: 'asc' },
        skip,
        take: limite,
        select: {
          idproductos:                    true,
          codigoproductos:                true,
          nombreproductos:                true,
          precioproductos:                true,
          cantidad_minima_ventaproductos: true,
          cantidad_maxima_ventaproductos: true,
          activoproductos:                true,
          created_atproductos:            true,
          updated_atproductos:            true,
          tarifasEspecialCantidad: {
            where:   { activotarifas_especial: true, deleted_attarifas_especial: null },
            orderBy: { min_cantidadtarifas_especial: 'asc' },
            select: {
              min_cantidadtarifas_especial: true,
              max_cantidadtarifas_especial: true,
              preciotarifas_especial:       true,
            },
          },
        },
      }),
    ]);

    const datos = rows.map(r => ({
      id:             r.idproductos,
      codigo:         r.codigoproductos,
      nombre:         r.nombreproductos,
      precio:         Number(r.precioproductos),
      cantidadMinima: r.cantidad_minima_ventaproductos,
      cantidadMaxima: r.cantidad_maxima_ventaproductos,
      activo:         r.activoproductos,
      createdAt:      r.created_atproductos,
      updatedAt:      r.updated_atproductos,
      tarifas: r.tarifasEspecialCantidad.map(t => ({
        minCantidad: t.min_cantidadtarifas_especial,
        maxCantidad: t.max_cantidadtarifas_especial ?? null,
        precio:      Number(t.preciotarifas_especial),
      })),
    }));

    const paginas = Math.ceil(total / limite);
    return { datos, meta: { total, pagina, limite, paginas } };
  }

  async findOne(id: number): Promise<ProductoEspecialEntity> {
    return this.toEntity(id);
  }

  async create(dto: {
    codigo:          string;
    nombre:          string;
    precio:          number;
    cantidadMinima?: number | null;
    cantidadMaxima?: number | null;
    tarifas?:        TarifaEspecialDto[];
  }): Promise<ProductoEspecialEntity> {
    this.validatePrecio(dto.precio);
    if (dto.tarifas?.length) this.validateTarifas(dto.tarifas);

    const existing = await this.prisma.producto.count({
      where: { codigoproductos: dto.codigo, deleted_atproductos: null },
    });
    if (existing > 0) throw new BadRequestException(`El código ${dto.codigo} ya existe`);

    const row = await this.prisma.producto.create({
      data: {
        codigoproductos:                dto.codigo,
        nombreproductos:                dto.nombre,
        tipoproductos:                  'otro',
        precioproductos:                dto.precio,
        porcentaje_taxproductos:        0,
        activoproductos:                true,
        cantidad_minima_ventaproductos: dto.cantidadMinima ?? null,
        cantidad_maxima_ventaproductos: dto.cantidadMaxima ?? null,
      },
    });

    if (dto.tarifas?.length) {
      await this.prisma.tarifaEspecialCantidad.createMany({
        data: dto.tarifas.map(t => ({
          productos_idproductos:         row.idproductos,
          min_cantidadtarifas_especial:  t.minCantidad,
          max_cantidadtarifas_especial:  t.maxCantidad ?? null,
          preciotarifas_especial:        t.precio,
          activotarifas_especial:        true,
        })),
      });
    }

    return this.toEntity(row.idproductos);
  }

  async update(id: number, dto: {
    nombre?:         string;
    precio?:         number;
    cantidadMinima?: number | null;
    cantidadMaxima?: number | null;
    activo?:         boolean;
  }): Promise<ProductoEspecialEntity> {
    await this.toEntity(id);
    if (dto.precio !== undefined) this.validatePrecio(dto.precio);

    await this.prisma.producto.update({
      where: { idproductos: id },
      data: {
        ...(dto.nombre         !== undefined && { nombreproductos:                dto.nombre }),
        ...(dto.precio         !== undefined && { precioproductos:                dto.precio }),
        ...(dto.cantidadMinima !== undefined && { cantidad_minima_ventaproductos: dto.cantidadMinima }),
        ...(dto.cantidadMaxima !== undefined && { cantidad_maxima_ventaproductos: dto.cantidadMaxima }),
        ...(dto.activo         !== undefined && { activoproductos:                dto.activo }),
        updated_atproductos: new Date(),
      },
    });

    return this.toEntity(id);
  }

  async setTarifas(id: number, tarifas: TarifaEspecialDto[]): Promise<ProductoEspecialEntity> {
    await this.toEntity(id);
    this.validateTarifas(tarifas);

    await this.prisma.$transaction([
      this.prisma.tarifaEspecialCantidad.deleteMany({ where: { productos_idproductos: id } }),
      ...(tarifas.length ? [this.prisma.tarifaEspecialCantidad.createMany({
        data: tarifas.map(t => ({
          productos_idproductos:         id,
          min_cantidadtarifas_especial:  t.minCantidad,
          max_cantidadtarifas_especial:  t.maxCantidad ?? null,
          preciotarifas_especial:        t.precio,
          activotarifas_especial:        true,
        })),
      })] : []),
    ]);

    return this.toEntity(id);
  }

  async remove(id: number): Promise<ProductoEspecialEntity> {
    const entity = await this.toEntity(id);
    await this.prisma.producto.update({
      where: { idproductos: id },
      data:  { activoproductos: false, deleted_atproductos: new Date(), updated_atproductos: new Date() },
    });
    return { ...entity, activo: false };
  }
}
