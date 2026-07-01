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

  // ── 1. Jerarquía comercial ─────────────────────────────────────────────────
  get comercio()   { return this.client.comercio; }
  get regional()   { return this.client.regional; }
  get sucursal()   { return this.client.sucursal; }
  get equipoAutorizado() { return this.client.equipoAutorizado; }
  get documento()  { return this.client.documento; }

  // ── 2. Roles y permisos ────────────────────────────────────────────────────
  get rol()        { return this.client.rol; }
  get permiso()    { return this.client.permiso; }
  get rolPermiso() { return this.client.rolPermiso; }

  // ── 3. Usuarios ────────────────────────────────────────────────────────────
  get usuario()    { return this.client.usuario; }

  // ── 4. Tipos de cliente ────────────────────────────────────────────────────
  get tipoCliente() { return this.client.tipoCliente; }

  // ── 5. Productos ───────────────────────────────────────────────────────────
  get producto()         { return this.client.producto; }
  get productoSucursal() { return this.client.productoSucursal; }
  get tarifaProducto()   { return this.client.tarifaProducto; }

  // ── 6. Servicios de envío ──────────────────────────────────────────────────
  get servicio()         { return this.client.servicio; }
  get servicioSucursal() { return this.client.servicioSucursal; }
  get tarifaServicio()   { return this.client.tarifaServicio; }

  // ── 7. Clientes ────────────────────────────────────────────────────────────
  get cliente() { return this.client.cliente; }

  // ── 8. Cajas ───────────────────────────────────────────────────────────────
  get cajaPadre()   { return this.client.cajaPadre; }
  get caja()        { return this.client.caja; }
  get sesionCaja()  { return this.client.sesionCaja; }

  // ── 9. Movimientos de caja ─────────────────────────────────────────────────
  get movimientoCaja()  { return this.client.movimientoCaja; }
  get consignacion()    { return this.client.consignacion; }
  get reposicionCaja()  { return this.client.reposicionCaja; }

  // ── 10. Ventas ─────────────────────────────────────────────────────────────
  get venta()        { return this.client.venta; }
  get ventaDetalle() { return this.client.ventaDetalle; }

  // ── 11. Envíos ─────────────────────────────────────────────────────────────
  get envio()     { return this.client.envio; }
  get envioItem() { return this.client.envioItem; }

  // ── 12. Facturación ────────────────────────────────────────────────────────
  get factura()     { return this.client.factura; }
  get facturaItem() { return this.client.facturaItem; }

  // ── 13. Inventario ─────────────────────────────────────────────────────────
  get inventarioSucursal()    { return this.client.inventarioSucursal; }
  get movimientoInventario()  { return this.client.movimientoInventario; }
  get ordenInventario()       { return this.client.ordenInventario; }
  get ordenInventarioItem()   { return this.client.ordenInventarioItem; }

  // ── 14. Sacas ──────────────────────────────────────────────────────────────
  get saca()      { return this.client.saca; }
  get envioSaca() { return this.client.envioSaca; }

  // ── 15. Apartados postales ─────────────────────────────────────────────────
  get apartadoPostal() { return this.client.apartadoPostal; }

  // ── 16. Giros ──────────────────────────────────────────────────────────────
  get giro() { return this.client.giro; }

  // ── 17. Recaudos y convenios ───────────────────────────────────────────────
  get convenioRecaudo()  { return this.client.convenioRecaudo; }
  get convenioSucursal() { return this.client.convenioSucursal; }
  get recaudo()          { return this.client.recaudo; }

  // ── 18. Listas restrictivas e Inspektor ────────────────────────────────────
  get listaRestrictiva()   { return this.client.listaRestrictiva; }
  get consultaInspektor()  { return this.client.consultaInspektor; }

  // ── 19. Alertas y anulaciones ──────────────────────────────────────────────
  get alerta()    { return this.client.alerta; }
  get anulacion() { return this.client.anulacion; }

  // ── 20. Auditoría ──────────────────────────────────────────────────────────
  get eventoAuditoria() { return this.client.eventoAuditoria; }

  // ── 21. Feature flags ──────────────────────────────────────────────────────
  get featureFlag() { return this.client.featureFlag; }

  // ── Transacciones ──────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get $transaction(): any { return this.client.$transaction.bind(this.client); }

  async onModuleInit()    { await this.client.$connect(); }
  async onModuleDestroy() { await this.client.$disconnect(); }
}
