import { describe, it, expect } from 'vitest';

// Lógica pura de scoping extraída del service para testear sin Prisma
type Rol = string;

function esGestorTotal(rol: Rol): boolean {
  return rol === 'ADMIN_SISTEMA' || rol === 'ADMIN_NACIONAL' || rol === 'INVENTARIOS';
}

function buildSucursalWhere(
  rol: Rol,
  userSucursalId: number | null,
  userRegionalId: number | null,
): Record<string, unknown> {
  if (esGestorTotal(rol))       return {};
  if (rol === 'SUPERVISOR_REGIONAL') return { regionales_idregionales: userRegionalId ?? -1 };
  return { idsucursales: userSucursalId ?? -1 };
}

describe('InventarioService — scoping por rol', () => {
  describe('esGestorTotal', () => {
    it('INVENTARIOS tiene acceso total', () => expect(esGestorTotal('INVENTARIOS')).toBe(true));
    it('ADMIN_SISTEMA tiene acceso total',  () => expect(esGestorTotal('ADMIN_SISTEMA')).toBe(true));
    it('ADMIN_NACIONAL tiene acceso total', () => expect(esGestorTotal('ADMIN_NACIONAL')).toBe(true));
    it('CAJERO no tiene acceso total',      () => expect(esGestorTotal('CAJERO')).toBe(false));
    it('SUPERVISOR_REGIONAL no tiene acceso total', () => expect(esGestorTotal('SUPERVISOR_REGIONAL')).toBe(false));
  });

  describe('buildSucursalWhere', () => {
    it('INVENTARIOS → where vacío (todas las sucursales)', () => {
      expect(buildSucursalWhere('INVENTARIOS', 5, 2)).toEqual({});
    });

    it('ADMIN_SISTEMA → where vacío (todas las sucursales)', () => {
      expect(buildSucursalWhere('ADMIN_SISTEMA', null, null)).toEqual({});
    });

    it('SUPERVISOR_REGIONAL → filtra por su regional', () => {
      expect(buildSucursalWhere('SUPERVISOR_REGIONAL', null, 3)).toEqual({
        regionales_idregionales: 3,
      });
    });

    it('SUPERVISOR_REGIONAL sin regional asignada → where con -1 (sin resultados)', () => {
      expect(buildSucursalWhere('SUPERVISOR_REGIONAL', null, null)).toEqual({
        regionales_idregionales: -1,
      });
    });

    it('CAJERO → filtra solo su sucursal', () => {
      expect(buildSucursalWhere('CAJERO', 7, 1)).toEqual({ idsucursales: 7 });
    });

    it('CAJERO sin sucursal asignada → where con -1 (sin resultados)', () => {
      expect(buildSucursalWhere('CAJERO', null, null)).toEqual({ idsucursales: -1 });
    });

    it('TESORERIA → filtra solo su sucursal', () => {
      expect(buildSucursalWhere('TESORERIA', 4, 2)).toEqual({ idsucursales: 4 });
    });

    it('ADMINISTRATIVO → filtra solo su sucursal', () => {
      expect(buildSucursalWhere('ADMINISTRATIVO', 9, 1)).toEqual({ idsucursales: 9 });
    });
  });
});
