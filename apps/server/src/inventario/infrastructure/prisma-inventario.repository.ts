import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  IInventarioRepository,
  QueryStockParams,
  DescontarInventarioParams,
  RestaurarInventarioParams,
  AjustarStockParams,
  RegistrarEntradaParams,
} from '../domain/inventario.repository.js';
import type { StockEntity, MovimientoInventarioEntity } from '../domain/inventario.entity.js';
import { calcularEstadoStock } from '../domain/business-rules.js';

const INV_UNIQUE = (sucursalId: number, productoId: number) => ({
  sucursales_idsucursales_productos_idproductos: {
    sucursales_idsucursales: sucursalId,
    productos_idproductos:   productoId,
  },
});

@Injectable()
export class PrismaInventarioRepository implements IInventarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStock(sucursalId: number, productoId: number): Promise<number | null> {
    const row = await this.prisma.inventarioSucursal.findUnique({
      where:  INV_UNIQUE(sucursalId, productoId),
      select: { cantidad_actualinventario_sucursal: true },
    });
    return row?.cantidad_actualinventario_sucursal ?? null;
  }

  async listStock(
    sucursalId: number,
    query: QueryStockParams,
  ): Promise<{ datos: StockEntity[]; total: number }> {
    const offset = (query.pagina - 1) * query.limite;

    const whereProducto: Record<string, unknown> = { activoproductos: true };
    if (query.buscar) {
      whereProducto['OR'] = [
        { nombreproductos: { contains: query.buscar, mode: 'insensitive' } },
        { codigoproductos: { contains: query.buscar, mode: 'insensitive' } },
      ];
    }
    if (query.soloConStock) {
      whereProducto['inventarioSucursal'] = {
        some: {
          sucursales_idsucursales:            sucursalId,
          cantidad_actualinventario_sucursal: { gt: 0 },
        },
      };
    }

    const selectProducto = {
      idproductos:     true,
      codigoproductos: true,
      nombreproductos: true,
      tipoproductos:   true,
      inventarioSucursal: {
        where:  { sucursales_idsucursales: sucursalId },
        select: {
          cantidad_actualinventario_sucursal: true,
          cantidad_minimainventario_sucursal: true,
          updated_atinventario_sucursal:      true,
        },
      },
    } as const;

    const toStockEntity = (
      p: Awaited<ReturnType<typeof this.prisma.producto.findMany<{ select: typeof selectProducto }>>>[number],
    ): StockEntity => {
      const inv    = p.inventarioSucursal[0];
      const actual = inv?.cantidad_actualinventario_sucursal ?? 0;
      const minimo = inv?.cantidad_minimainventario_sucursal ?? 5;
      return {
        productoId:          p.idproductos,
        productoCodigo:      p.codigoproductos,
        productoNombre:      p.nombreproductos,
        productoTipo:        p.tipoproductos,
        sucursalId,
        stockActual:         actual,
        stockMinimo:         minimo,
        estado:              calcularEstadoStock(actual, minimo),
        ultimaActualizacion: inv?.updated_atinventario_sucursal ?? null,
      };
    };

    if (query.estado) {
      const todos      = await this.prisma.producto.findMany({
        where: whereProducto, select: selectProducto,
        orderBy: [{ tipoproductos: 'asc' }, { nombreproductos: 'asc' }],
      });
      const filtrados  = todos.map(toStockEntity).filter(i => i.estado === query.estado);
      return { datos: filtrados.slice(offset, offset + query.limite), total: filtrados.length };
    }

    const [productos, total] = await Promise.all([
      this.prisma.producto.findMany({
        where: whereProducto, select: selectProducto,
        orderBy: [{ tipoproductos: 'asc' }, { nombreproductos: 'asc' }],
        skip: offset, take: query.limite,
      }),
      this.prisma.producto.count({ where: whereProducto }),
    ]);
    return { datos: productos.map(toStockEntity), total };
  }

  async ajustar(params: AjustarStockParams): Promise<StockEntity> {
    const producto = await this.prisma.producto.findFirst({
      where: {
        idproductos:       params.productoId,
        activoproductos:   true,
        productosSucursal: {
          some: { sucursales_idsucursales: params.sucursalId, activoproductos_sucursal: true },
        },
      },
      select: { idproductos: true, codigoproductos: true, nombreproductos: true, tipoproductos: true },
    });
    if (!producto) throw new BadRequestException('Producto no encontrado o no disponible en esta sucursal.');

    await this.prisma.$transaction(async (tx) => {
      const inv = await tx.inventarioSucursal.findUnique({ where: INV_UNIQUE(params.sucursalId, params.productoId) });
      const cantidadAnterior = inv?.cantidad_actualinventario_sucursal ?? 0;
      const delta            = params.cantidadNueva - cantidadAnterior;

      await tx.inventarioSucursal.upsert({
        where:  INV_UNIQUE(params.sucursalId, params.productoId),
        update: { cantidad_actualinventario_sucursal: params.cantidadNueva, updated_atinventario_sucursal: new Date() },
        create: { sucursales_idsucursales: params.sucursalId, productos_idproductos: params.productoId, cantidad_actualinventario_sucursal: params.cantidadNueva, cantidad_minimainventario_sucursal: 5 },
      });

      if (delta !== 0) {
        await tx.movimientoInventario.create({
          data: {
            sucursales_idsucursales:                  params.sucursalId,
            productos_idproductos:                    params.productoId,
            tipomovimientos_inventario:               'ajuste',
            cantidadmovimientos_inventario:           Math.abs(delta),
            cantidad_anteriormovimientos_inventario:  cantidadAnterior,
            cantidad_posteriormovimientos_inventario: params.cantidadNueva,
            referencia_tipomovimientos_inventario:    'AjusteManual',
            usuarios_idusuarios:                     params.usuarioId,
            observacionmovimientos_inventario:        params.observacion ?? null,
          },
        });
      }
    });

    return this._getStockEntity(params.sucursalId, params.productoId, producto);
  }

  async registrarEntrada(params: RegistrarEntradaParams): Promise<StockEntity> {
    if (params.cantidad <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0.');
    const producto = await this.prisma.producto.findFirst({
      where:  { idproductos: params.productoId, activoproductos: true },
      select: { idproductos: true, codigoproductos: true, nombreproductos: true, tipoproductos: true },
    });
    if (!producto) throw new BadRequestException('Producto no encontrado o inactivo.');

    await this.prisma.$transaction(async (tx) => {
      const inv              = await tx.inventarioSucursal.findUnique({ where: INV_UNIQUE(params.sucursalId, params.productoId) });
      const cantidadAnterior = inv?.cantidad_actualinventario_sucursal ?? 0;
      const cantidadNueva    = cantidadAnterior + params.cantidad;

      await tx.inventarioSucursal.upsert({
        where:  INV_UNIQUE(params.sucursalId, params.productoId),
        update: { cantidad_actualinventario_sucursal: cantidadNueva, updated_atinventario_sucursal: new Date() },
        create: { sucursales_idsucursales: params.sucursalId, productos_idproductos: params.productoId, cantidad_actualinventario_sucursal: cantidadNueva, cantidad_minimainventario_sucursal: 5 },
      });

      await tx.movimientoInventario.create({
        data: {
          sucursales_idsucursales:                  params.sucursalId,
          productos_idproductos:                    params.productoId,
          tipomovimientos_inventario:               'entrada',
          cantidadmovimientos_inventario:           params.cantidad,
          cantidad_anteriormovimientos_inventario:  cantidadAnterior,
          cantidad_posteriormovimientos_inventario: cantidadNueva,
          referencia_tipomovimientos_inventario:    'EntradaMercancia',
          usuarios_idusuarios:                     params.usuarioId,
          observacionmovimientos_inventario:        params.observacion ?? null,
        },
      });
    });

    return this._getStockEntity(params.sucursalId, params.productoId, producto);
  }

  async descontarInventario(params: DescontarInventarioParams): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const inv = await tx.inventarioSucursal.findUnique({ where: INV_UNIQUE(params.sucursalId, params.productoId) });
      const cantidadAnterior = inv?.cantidad_actualinventario_sucursal ?? 0;

      if (cantidadAnterior < params.cantidad) {
        throw Object.assign(
          new Error(`Stock insuficiente para producto ${params.productoId}: disponible ${cantidadAnterior}, requerido ${params.cantidad}`),
          { code: 'STOCK_INSUFICIENTE', stockActual: cantidadAnterior, cantidadRequerida: params.cantidad },
        );
      }

      const cantidadPosterior = cantidadAnterior - params.cantidad;

      await tx.inventarioSucursal.upsert({
        where:  INV_UNIQUE(params.sucursalId, params.productoId),
        update: { cantidad_actualinventario_sucursal: { decrement: params.cantidad }, updated_atinventario_sucursal: new Date() },
        create: { sucursales_idsucursales: params.sucursalId, productos_idproductos: params.productoId, cantidad_actualinventario_sucursal: -params.cantidad },
      });

      await tx.movimientoInventario.create({
        data: {
          sucursales_idsucursales:                  params.sucursalId,
          productos_idproductos:                    params.productoId,
          tipomovimientos_inventario:               'salida',
          cantidadmovimientos_inventario:           params.cantidad,
          cantidad_anteriormovimientos_inventario:  cantidadAnterior,
          cantidad_posteriormovimientos_inventario: cantidadPosterior,
          referencia_idmovimientos_inventario:      params.referenciaId,
          referencia_tipomovimientos_inventario:    params.referenciaTipo,
          usuarios_idusuarios:                     params.usuarioId,
        },
      });
    });
  }

  async restaurarInventario(params: RestaurarInventarioParams): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const inv              = await tx.inventarioSucursal.findUnique({ where: INV_UNIQUE(params.sucursalId, params.productoId) });
      const cantidadAnterior = inv?.cantidad_actualinventario_sucursal ?? 0;
      const cantidadPosterior = cantidadAnterior + params.cantidad;

      await tx.inventarioSucursal.upsert({
        where:  INV_UNIQUE(params.sucursalId, params.productoId),
        update: { cantidad_actualinventario_sucursal: { increment: params.cantidad }, updated_atinventario_sucursal: new Date() },
        create: { sucursales_idsucursales: params.sucursalId, productos_idproductos: params.productoId, cantidad_actualinventario_sucursal: params.cantidad },
      });

      await tx.movimientoInventario.create({
        data: {
          sucursales_idsucursales:                  params.sucursalId,
          productos_idproductos:                    params.productoId,
          tipomovimientos_inventario:               'devolucion',
          cantidadmovimientos_inventario:           params.cantidad,
          cantidad_anteriormovimientos_inventario:  cantidadAnterior,
          cantidad_posteriormovimientos_inventario: cantidadPosterior,
          referencia_idmovimientos_inventario:      params.referenciaId,
          referencia_tipomovimientos_inventario:    params.referenciaTipo,
          usuarios_idusuarios:                     params.usuarioId,
        },
      });
    });
  }

  async listMovimientos(
    sucursalId: number,
    query: { productoId?: number; tipo?: string; pagina: number; limite: number },
  ): Promise<{ datos: MovimientoInventarioEntity[]; total: number }> {
    const offset = (query.pagina - 1) * query.limite;
    const where: Record<string, unknown> = { sucursales_idsucursales: sucursalId };
    if (query.productoId) where['productos_idproductos'] = query.productoId;
    if (query.tipo)       where['tipomovimientos_inventario'] = query.tipo;

    const [rows, total] = await Promise.all([
      this.prisma.movimientoInventario.findMany({
        where,
        include: { producto: { select: { idproductos: true, codigoproductos: true, nombreproductos: true } } },
        orderBy: { created_atmovimientos_inventario: 'desc' },
        skip: offset, take: query.limite,
      }),
      this.prisma.movimientoInventario.count({ where }),
    ]);

    const datos: MovimientoInventarioEntity[] = rows.map(r => ({
      id:               r.idmovimientos_inventario,
      sucursalId:       r.sucursales_idsucursales,
      productoId:       r.productos_idproductos,
      tipo:             r.tipomovimientos_inventario as MovimientoInventarioEntity['tipo'],
      cantidad:         r.cantidadmovimientos_inventario,
      cantidadAnterior: r.cantidad_anteriormovimientos_inventario,
      cantidadPosterior: r.cantidad_posteriormovimientos_inventario,
      referenciaId:     r.referencia_idmovimientos_inventario,
      referenciaTipo:   r.referencia_tipomovimientos_inventario,
      observacion:      r.observacionmovimientos_inventario,
      usuarioId:        r.usuarios_idusuarios,
      createdAt:        r.created_atmovimientos_inventario,
      producto: {
        id:     r.producto.idproductos,
        codigo: r.producto.codigoproductos,
        nombre: r.producto.nombreproductos,
      },
    }));

    return { datos, total };
  }

  private async _getStockEntity(
    sucursalId: number,
    productoId: number,
    producto: { idproductos: number; codigoproductos: string; nombreproductos: string; tipoproductos: string },
  ): Promise<StockEntity> {
    const inv    = await this.prisma.inventarioSucursal.findUnique({ where: INV_UNIQUE(sucursalId, productoId) });
    const actual = inv?.cantidad_actualinventario_sucursal ?? 0;
    const minimo = inv?.cantidad_minimainventario_sucursal ?? 5;
    return {
      productoId:          producto.idproductos,
      productoCodigo:      producto.codigoproductos,
      productoNombre:      producto.nombreproductos,
      productoTipo:        producto.tipoproductos,
      sucursalId,
      stockActual:         actual,
      stockMinimo:         minimo,
      estado:              calcularEstadoStock(actual, minimo),
      ultimaActualizacion: inv?.updated_atinventario_sucursal ?? null,
    };
  }
}
