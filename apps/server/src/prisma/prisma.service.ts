import { Injectable, Optional, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { auditStore } from '../common/audit-context.js';
import { MongoDbChangesService } from '../audit/mongo/mongo-db-changes.service.js';

type Operacion = 'INSERT' | 'UPDATE' | 'DELETE';

const WRITE_OPS = new Set([
  'create', 'createMany', 'createManyAndReturn',
  'update', 'updateMany', 'updateManyAndReturn',
  'delete', 'deleteMany',
  'upsert',
]);

const OP_MAP: Record<string, Operacion> = {
  create:                  'INSERT',
  createMany:              'INSERT',
  createManyAndReturn:     'INSERT',
  update:                  'UPDATE',
  updateMany:              'UPDATE',
  updateManyAndReturn:     'UPDATE',
  upsert:                  'UPDATE',
  delete:                  'DELETE',
  deleteMany:              'DELETE',
};

function toCamel(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function extractId(obj: unknown): number {
  if (!obj || typeof obj !== 'object') return 0;
  const r = obj as Record<string, unknown>;
  const key = Object.keys(r).find(k => k.startsWith('id') && typeof r[k] === 'number');
  return key ? (r[key] as number) : 0;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // rawClient lee el estado previo sin pasar por el middleware — evita recursión
  private readonly rawClient: PrismaClient;
  private readonly client:    PrismaClient;

  constructor(@Optional() dbChanges?: MongoDbChangesService) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

    this.rawClient = new PrismaClient({ adapter });

    const raw = this.rawClient;
    const cambios = dbChanges;

    const extended = raw.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!WRITE_OPS.has(operation)) return query(args);

            // estado anterior para UPDATE / DELETE / upsert
            let antes: unknown = null;
            const singleMutation = ['update', 'delete', 'upsert'].includes(operation);
            if (singleMutation && (args as Record<string, unknown>)?.where) {
              antes = await (raw as unknown as Record<string, { findFirst: (a: unknown) => Promise<unknown> }>)
                [toCamel(model)]
                .findFirst({ where: (args as Record<string, unknown>).where })
                .catch(() => null);
            }

            const result = await query(args);

            const ctx = auditStore.getStore();
            let operacion: Operacion = OP_MAP[operation] ?? 'INSERT';

            // upsert: si no había registro previo fue INSERT
            if (operation === 'upsert' && antes === null) operacion = 'INSERT';

            const registroId = extractId(result) || extractId(antes);

            cambios?.log({
              tabla:         model,
              operacion,
              registro_id:   registroId,
              usuario_id:    ctx?.userId,
              ip:            ctx?.ip,
              request_id:    ctx?.requestId,
              datos_antes:   (antes ?? null) as Record<string, unknown> | null,
              datos_despues: (result ?? null) as Record<string, unknown> | null,
            });

            return result;
          },
        },
      },
    });

    // cast seguro: $extends preserva todos los delegates del modelo
    this.client = extended as unknown as PrismaClient;
  }

  // ── 0. Geo ────────────────────────────────────────────────────────────────
  get pais()            { return this.client.pais; }
  get departamento()    { return this.client.departamento; }
  get ciudad()          { return this.client.ciudad; }

  // ── 1. Jerarquía comercial ─────────────────────────────────────────────────
  get comercio()        { return this.client.comercio; }
  get regional()        { return this.client.regional; }
  get sucursal()        { return this.client.sucursal; }
  get equipoAutorizado(){ return this.client.equipoAutorizado; }
  get documento()       { return this.client.documento; }

  // ── 2. Roles y permisos ────────────────────────────────────────────────────
  get rol()             { return this.client.rol; }
  get permiso()         { return this.client.permiso; }
  get rolPermiso()      { return this.client.rolPermiso; }

  // ── 3. Usuarios ────────────────────────────────────────────────────────────
  get usuario()         { return this.client.usuario; }

  // ── 4. Tipos de cliente ────────────────────────────────────────────────────
  get tipoCliente()     { return this.client.tipoCliente; }

  // ── 5. Productos ───────────────────────────────────────────────────────────
  get producto()                 { return this.client.producto; }
  get productoSucursal()         { return this.client.productoSucursal; }
  get tarifaProducto()           { return this.client.tarifaProducto; }
  get tarifaEspecialCantidad()   { return this.client.tarifaEspecialCantidad; }

  // ── 6. Servicios de envío ──────────────────────────────────────────────────
  get servicio()        { return this.client.servicio; }
  get servicioSucursal(){ return this.client.servicioSucursal; }
  get tarifaServicio()  { return this.client.tarifaServicio; }

  // ── 7. Clientes ────────────────────────────────────────────────────────────
  get cliente()         { return this.client.cliente; }

  // ── 8. Cajas ───────────────────────────────────────────────────────────────
  get cajaPadre()       { return this.client.cajaPadre; }
  get caja()            { return this.client.caja; }
  get servicioCaja()    { return this.client.servicioCaja; }
  get sesionCaja()      { return this.client.sesionCaja; }

  // ── 9. Movimientos de caja ─────────────────────────────────────────────────
  get movimientoCaja()  { return this.client.movimientoCaja; }
  get movimientoTesoreria() { return this.client.movimientoTesoreria; }
  get franquicia()          { return this.client.franquicia; }
  get franquiciaSucursal()  { return this.client.franquiciaSucursal; }
  get consignacion()    { return this.client.consignacion; }
  get reposicionCaja()  { return this.client.reposicionCaja; }
  get diferenciaCaja()  { return this.client.diferenciaCaja; }

  // ── 10. Ventas ─────────────────────────────────────────────────────────────
  get venta()           { return this.client.venta; }
  get ventaDetalle()    { return this.client.ventaDetalle; }

  // ── 11. Envíos ─────────────────────────────────────────────────────────────
  get envio()                 { return this.client.envio; }
  get envioItem()             { return this.client.envioItem; }
  get direccionFrecuente()    { return this.client.direccionFrecuente; }

  // ── 22. Envíos masivos ─────────────────────────────────────────────────────
  get envioMasivo()           { return this.client.envioMasivo; }
  get envioMasivoItem()       { return this.client.envioMasivoItem; }

  // ── 12. Facturación ────────────────────────────────────────────────────────
  get factura()         { return this.client.factura; }
  get facturaItem()     { return this.client.facturaItem; }

  // ── 13. Inventario ─────────────────────────────────────────────────────────
  get inventarioSucursal()   { return this.client.inventarioSucursal; }
  get movimientoInventario() { return this.client.movimientoInventario; }
  get ordenInventario()      { return this.client.ordenInventario; }
  get ordenInventarioItem()  { return this.client.ordenInventarioItem; }

  // ── 14. Sacas ──────────────────────────────────────────────────────────────
  get saca()            { return this.client.saca; }
  get envioSaca()       { return this.client.envioSaca; }

  // ── 15. Apartados postales ─────────────────────────────────────────────────
  get apartadoPostal()  { return this.client.apartadoPostal; }

  // ── 16. Giros ──────────────────────────────────────────────────────────────
  get giro()            { return this.client.giro; }

  // ── 17. Recaudos y convenios ───────────────────────────────────────────────
  get convenioRecaudo() { return this.client.convenioRecaudo; }
  get convenioSucursal(){ return this.client.convenioSucursal; }
  get recaudo()         { return this.client.recaudo; }

  // ── 18. Listas restrictivas e Inspektor ────────────────────────────────────
  get listaRestrictiva()  { return this.client.listaRestrictiva; }
  get consultaInspektor() { return this.client.consultaInspektor; }

  // ── 19. Alertas y anulaciones ──────────────────────────────────────────────
  get alerta()          { return this.client.alerta; }
  get anulacion()       { return this.client.anulacion; }

  // ── 21. Feature flags ──────────────────────────────────────────────────────
  get featureFlag()        { return this.client.featureFlag; }
  get featureFlagRol()     { return this.client.featureFlagRol; }
  get featureFlagUsuario() { return this.client.featureFlagUsuario; }

  // ── Transacciones ──────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get $transaction(): any { return this.client.$transaction.bind(this.client); }

  // ── SQL crudo ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get $queryRaw(): any { return this.client.$queryRaw.bind(this.client); }

  async onModuleInit() {
    await this.rawClient.$connect();
  }

  async onModuleDestroy() {
    await this.rawClient.$disconnect();
  }
}
