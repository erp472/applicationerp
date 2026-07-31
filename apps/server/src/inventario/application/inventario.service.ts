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
