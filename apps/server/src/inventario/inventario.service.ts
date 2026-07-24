import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { QueryInventarioDto, QueryMovimientosDto } from './dto/query-inventario.dto.js';

export interface StockItem {
  productoId:          number;
  productoCodigo:      string;
  productoNombre:      string;
  productoTipo:        string;
  stockActual:         number;
  stockMinimo:         number;
  estado:              'ok' | 'bajo' | 'critico';
  ultimaActualizacion: string | null;
}

export interface MovimientoItem {
  id:               number;
  tipo:             string;
  cantidad:         number;
  cantidadAnterior: number;
  cantidadPosterior: number;
  referenciaId:     number | null;
  referenciaTipo:   string | null;
  observacion:      string | null;
  fecha:            string;
  producto: { id: number; codigo: string; nombre: string };
}

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Stock por sucursal ────────────────────────────────────────────────────

  async listStock(
    sucursalId: number,
    query: QueryInventarioDto,
    userRol: string,
    userSucursalId: number | null,
  ): Promise<{ datos: StockItem[]; total: number }> {
    this.assertAccesoSucursal(sucursalId, userRol, userSucursalId);

    const offset = (query.pagina - 1) * query.limite;

    const whereProducto: Record<string, unknown> = { activoproductos: true };
    if (query.buscar) {
      whereProducto['OR'] = [
        { nombreproductos:  { contains: query.buscar, mode: 'insensitive' } },
        { codigoproductos:  { contains: query.buscar, mode: 'insensitive' } },
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

    const productos = await this.prisma.producto.findMany({
      where:   whereProducto,
      select: {
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
      },
      orderBy: [{ tipoproductos: 'asc' }, { nombreproductos: 'asc' }],
      skip:    offset,
      take:    query.limite,
    });

    const total = await this.prisma.producto.count({ where: whereProducto });

    const datos: StockItem[] = productos
      .map((p) => {
        const inv       = p.inventarioSucursal[0];
        const actual    = inv?.cantidad_actualinventario_sucursal ?? 0;
        const minimo    = inv?.cantidad_minimainventario_sucursal ?? 5;
        const estado    = actual >= minimo ? 'ok' : actual > 0 ? 'bajo' : 'critico';

        return {
          productoId:          p.idproductos,
          productoCodigo:      p.codigoproductos,
          productoNombre:      p.nombreproductos,
          productoTipo:        p.tipoproductos,
          stockActual:         actual,
          stockMinimo:         minimo,
          estado,
          ultimaActualizacion: inv?.updated_atinventario_sucursal?.toISOString() ?? null,
        };
      });

    return { datos, total };
  }

  // ── Ajuste de conteo físico ───────────────────────────────────────────────

  async ajustar(
    sucursalId:     number,
    productoId:     number,
    cantidadNueva:  number,
    observacion:    string | undefined,
    userId:         number,
    userRol:        string,
    userSucursalId: number | null,
  ): Promise<StockItem> {
    this.assertAccesoSucursal(sucursalId, userRol, userSucursalId);

    const producto = await this.prisma.producto.findFirst({
      where: {
        idproductos:       productoId,
        activoproductos:   true,
        productosSucursal: {
          some: {
            sucursales_idsucursales:  sucursalId,
            activoproductos_sucursal: true,
          },
        },
      },
      select: { idproductos: true, codigoproductos: true, nombreproductos: true, tipoproductos: true },
    });
    if (!producto) throw new BadRequestException('Producto no encontrado, inactivo o no disponible en esta sucursal.');

    await this.prisma.$transaction(async (tx) => {
      const inv = await tx.inventarioSucursal.findUnique({
        where: {
          sucursales_idsucursales_productos_idproductos: {
            sucursales_idsucursales: sucursalId,
            productos_idproductos:   productoId,
          },
        },
      });

      const cantidadAnterior  = inv?.cantidad_actualinventario_sucursal ?? 0;
      const delta             = cantidadNueva - cantidadAnterior;

      await tx.inventarioSucursal.upsert({
        where: {
          sucursales_idsucursales_productos_idproductos: {
            sucursales_idsucursales: sucursalId,
            productos_idproductos:   productoId,
          },
        },
        update: {
          cantidad_actualinventario_sucursal: cantidadNueva,
          updated_atinventario_sucursal:      new Date(),
        },
        create: {
          sucursales_idsucursales:            sucursalId,
          productos_idproductos:              productoId,
          cantidad_actualinventario_sucursal: cantidadNueva,
          cantidad_minimainventario_sucursal: 5,
        },
      });

      if (delta !== 0) {
        await tx.movimientoInventario.create({
          data: {
            sucursales_idsucursales:                  sucursalId,
            productos_idproductos:                    productoId,
            tipomovimientos_inventario:               'ajuste',
            cantidadmovimientos_inventario:           Math.abs(delta),
            cantidad_anteriormovimientos_inventario:  cantidadAnterior,
            cantidad_posteriormovimientos_inventario: cantidadNueva,
            referencia_tipomovimientos_inventario:    'AjusteManual',
            usuarios_idusuarios:                     userId,
            observacionmovimientos_inventario:        observacion ?? null,
          },
        });
      }
    });

    const invActualizado = await this.prisma.inventarioSucursal.findUnique({
      where: {
        sucursales_idsucursales_productos_idproductos: {
          sucursales_idsucursales: sucursalId,
          productos_idproductos:   productoId,
        },
      },
    });

    const actual  = invActualizado?.cantidad_actualinventario_sucursal ?? cantidadNueva;
    const minimo  = invActualizado?.cantidad_minimainventario_sucursal ?? 5;
    const estado  = actual >= minimo ? 'ok' : actual > 0 ? 'bajo' : 'critico';

    return {
      productoId:          producto.idproductos,
      productoCodigo:      producto.codigoproductos,
      productoNombre:      producto.nombreproductos,
      productoTipo:        producto.tipoproductos,
      stockActual:         actual,
      stockMinimo:         minimo,
      estado,
      ultimaActualizacion: invActualizado?.updated_atinventario_sucursal?.toISOString() ?? null,
    };
  }

  // ── Historial de movimientos ──────────────────────────────────────────────

  async listMovimientos(
    sucursalId:     number,
    query:          QueryMovimientosDto,
    userRol:        string,
    userSucursalId: number | null,
  ): Promise<{ datos: MovimientoItem[]; total: number }> {
    this.assertAccesoSucursal(sucursalId, userRol, userSucursalId);

    const offset = (query.pagina - 1) * query.limite;

    const where: Record<string, unknown> = { sucursales_idsucursales: sucursalId };
    if (query.productoId) where['productos_idproductos'] = query.productoId;
    if (query.tipo)       where['tipomovimientos_inventario'] = query.tipo;

    const [rows, total] = await Promise.all([
      this.prisma.movimientoInventario.findMany({
        where,
        include: {
          producto: {
            select: { idproductos: true, codigoproductos: true, nombreproductos: true },
          },
        },
        orderBy: { created_atmovimientos_inventario: 'desc' },
        skip:    offset,
        take:    query.limite,
      }),
      this.prisma.movimientoInventario.count({ where }),
    ]);

    const datos: MovimientoItem[] = rows.map((r) => ({
      id:               r.idmovimientos_inventario,
      tipo:             r.tipomovimientos_inventario,
      cantidad:         r.cantidadmovimientos_inventario,
      cantidadAnterior: r.cantidad_anteriormovimientos_inventario,
      cantidadPosterior: r.cantidad_posteriormovimientos_inventario,
      referenciaId:     r.referencia_idmovimientos_inventario,
      referenciaTipo:   r.referencia_tipomovimientos_inventario,
      observacion:      r.observacionmovimientos_inventario,
      fecha:            r.created_atmovimientos_inventario.toISOString(),
      producto: {
        id:     r.producto.idproductos,
        codigo: r.producto.codigoproductos,
        nombre: r.producto.nombreproductos,
      },
    }));

    return { datos, total };
  }

  // ── Guard de sucursal ─────────────────────────────────────────────────────

  private assertAccesoSucursal(
    sucursalId:     number,
    rol:            string,
    userSucursalId: number | null,
  ) {
    const esAdmin = rol === 'ADMIN_SISTEMA' || rol === 'ADMIN_NACIONAL';
    if (!esAdmin && userSucursalId !== sucursalId) {
      throw new ForbiddenException('No tienes acceso al inventario de esta sucursal.');
    }
  }
}
