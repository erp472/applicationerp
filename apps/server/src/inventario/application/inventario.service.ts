import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { INVENTARIO_REPOSITORY } from '../domain/inventario.repository.js';
import type { IInventarioRepository, QueryStockParams } from '../domain/inventario.repository.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class InventarioService {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly repo: IInventarioRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Stock ──────────────────────────────────────────────────────────────────

  async listStock(sucursalId: number, query: QueryStockParams, userRol: string, userSucursalId: number | null) {
    this.assertAcceso(sucursalId, userRol, userSucursalId);
    const { datos, total } = await this.repo.listStock(sucursalId, query);
    return { datos, total };
  }

  async ajustar(
    sucursalId: number, productoId: number, cantidadNueva: number,
    observacion: string | undefined, usuarioId: number, userRol: string, userSucursalId: number | null,
  ) {
    this.assertAcceso(sucursalId, userRol, userSucursalId);
    return this.repo.ajustar({ sucursalId, productoId, cantidadNueva, observacion, usuarioId });
  }

  async registrarEntrada(
    sucursalId: number, productoId: number, cantidad: number,
    observacion: string | undefined, usuarioId: number, userRol: string, userSucursalId: number | null,
  ) {
    this.assertAcceso(sucursalId, userRol, userSucursalId);
    return this.repo.registrarEntrada({ sucursalId, productoId, cantidad, observacion, usuarioId });
  }

  async listMovimientos(
    sucursalId: number,
    query: { productoId?: number; tipo?: string; pagina: number; limite: number },
    userRol: string, userSucursalId: number | null,
  ) {
    this.assertAcceso(sucursalId, userRol, userSucursalId);
    return this.repo.listMovimientos(sucursalId, query);
  }

  // ── Operaciones usadas por CajasModule/VentasModule ────────────────────────

  async getStock(sucursalId: number, productoId: number): Promise<number | null> {
    return this.repo.getStock(sucursalId, productoId);
  }

  async descontarInventario(params: {
    productoId: number; sucursalId: number; cantidad: number;
    referenciaId: number; referenciaTipo: string; usuarioId: number;
  }): Promise<void> {
    return this.repo.descontarInventario(params);
  }

  async restaurarInventario(params: {
    productoId: number; sucursalId: number; cantidad: number;
    referenciaId: number; referenciaTipo: string; usuarioId: number;
  }): Promise<void> {
    return this.repo.restaurarInventario(params);
  }

  // ── Resúmenes para UI ──────────────────────────────────────────────────────

  async getSucursales(userRol: string, userSucursalId: number | null) {
    const esAdmin = this.esAdmin(userRol);
    const where   = esAdmin ? {} : { idsucursales: userSucursalId ?? -1 };
    const rows    = await this.prisma.sucursal.findMany({
      where,
      select: {
        idsucursales: true, codigosucursales: true, nombresucursales: true,
        inventarioSucursal: {
          select: { cantidad_actualinventario_sucursal: true, cantidad_minimainventario_sucursal: true },
        },
      },
      orderBy: { nombresucursales: 'asc' },
    });
    return rows.map(s => ({
      id:             s.idsucursales,
      codigo:         s.codigosucursales,
      nombre:         s.nombresucursales,
      totalProductos: s.inventarioSucursal.length,
      alertas:        s.inventarioSucursal.filter(
        i => i.cantidad_actualinventario_sucursal < i.cantidad_minimainventario_sucursal,
      ).length,
    }));
  }

  async getAlertasResumen(userRol: string, userSucursalId: number | null) {
    const esAdmin = this.esAdmin(userRol);
    const where   = esAdmin ? {} : { idsucursales: userSucursalId ?? -1 };
    const sucursales = await this.prisma.sucursal.findMany({
      where,
      select: {
        idsucursales: true, nombresucursales: true,
        inventarioSucursal: {
          select: { cantidad_actualinventario_sucursal: true, cantidad_minimainventario_sucursal: true },
        },
      },
    });
    return sucursales
      .map(s => {
        const bajo    = s.inventarioSucursal.filter(i => i.cantidad_actualinventario_sucursal > 0 && i.cantidad_actualinventario_sucursal < i.cantidad_minimainventario_sucursal).length;
        const critico = s.inventarioSucursal.filter(i => i.cantidad_actualinventario_sucursal === 0).length;
        return { sucursalId: s.idsucursales, sucursalNombre: s.nombresucursales, bajo, critico };
      })
      .filter(s => s.bajo > 0 || s.critico > 0);
  }

  // ── Órdenes de inventario ─────────────────────────────────────────────────

  async crearOrden(sucursalId: number, items: { productoId: number; cantidadEnviada: number }[], usuarioId: number) {
    return this.prisma.ordenInventario.create({
      data: {
        sucursales_idsucursales:       sucursalId,
        usuarios_idusuarios_creador:   usuarioId,
        estadoordenes_inventario:      'pendiente',
        items: {
          create: items.map(i => ({
            productos_idproductos:                   i.productoId,
            cantidad_enviadaordenes_inventario_items: i.cantidadEnviada,
            estadoordenes_inventario_items:           'pendiente',
          })),
        },
      },
      include: {
        items: { include: { producto: { select: { codigoproductos: true, nombreproductos: true } } } },
        sucursal: { select: { nombresucursales: true } },
      },
    }).then(r => this._mapOrden(r));
  }

  async listOrdenes(sucursalId?: number, estado?: string) {
    const rows = await this.prisma.ordenInventario.findMany({
      where: {
        ...(sucursalId && { sucursales_idsucursales: sucursalId }),
        ...(estado     && { estadoordenes_inventario: estado as any }),
      },
      include: {
        items:    { include: { producto: { select: { codigoproductos: true, nombreproductos: true } } } },
        sucursal: { select: { nombresucursales: true } },
      },
      orderBy: { created_atordenes_inventario: 'desc' },
    });
    return rows.map(r => this._mapOrden(r));
  }

  async getOrdenesPendientes(sucursalId?: number) {
    return this.listOrdenes(sucursalId, 'pendiente');
  }

  async actualizarEstadoOrden(ordenId: number, estado: string, usuarioId: number) {
    return this.prisma.ordenInventario.update({
      where: { idordenes_inventario: ordenId },
      data: {
        estadoordenes_inventario:            estado as any,
        usuarios_idusuarios_confirmador:     usuarioId,
        fecha_confirmacionordenes_inventario: ['confirmada', 'rechazada', 'parcial'].includes(estado) ? new Date() : undefined,
      },
      include: {
        items:    { include: { producto: { select: { codigoproductos: true, nombreproductos: true } } } },
        sucursal: { select: { nombresucursales: true } },
      },
    }).then(r => this._mapOrden(r));
  }

  private _mapOrden(r: any) {
    return {
      id:            r.idordenes_inventario,
      sucursalId:    r.sucursales_idsucursales,
      sucursalNombre: r.sucursal?.nombresucursales ?? null,
      estado:        r.estadoordenes_inventario,
      createdAt:     r.created_atordenes_inventario,
      items: (r.items ?? []).map((i: any) => ({
        id:              i.idordenes_inventario_items,
        productoId:      i.productos_idproductos,
        productoCodigo:  i.producto?.codigoproductos ?? null,
        productoNombre:  i.producto?.nombreproductos ?? null,
        cantidadEnviada: i.cantidad_enviadaordenes_inventario_items,
        cantidadRecibida: i.cantidad_recibidaordenes_inventario_items ?? null,
        estado:          i.estadoordenes_inventario_items,
      })),
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private esAdmin(rol: string) {
    return rol === 'ADMIN_SISTEMA' || rol === 'ADMIN_NACIONAL';
  }

  private assertAcceso(sucursalId: number, rol: string, userSucursalId: number | null) {
    if (!this.esAdmin(rol) && userSucursalId !== sucursalId) {
      throw new ForbiddenException('No tienes acceso al inventario de esta sucursal.');
    }
  }
}
