import { describe, it, expect } from 'vitest';
import {
  validarSesionActivaParaVenta,
  validarCarritoNoVacio,
  validarVentaActiva,
  validarVentaEnSesion,
  calcularSubtotalDetalle,
  calcularTotalesCarrito,
  validarEfectivoSuficiente,
} from './business-rules.js';
import {
  SesionCajaInactivaError,
  CarritoVacioError,
  VentaYaAnuladaError,
  VentaDeOtroTurnoError,
  EfectivoInsuficienteError,
} from './venta.errors.js';

describe('Ventas business rules', () => {

  describe('BR-VEN-001 validarSesionActivaParaVenta', () => {
    it('lanza SesionCajaInactivaError si la sesión es null', () => {
      expect(() => validarSesionActivaParaVenta(5, null)).toThrow(SesionCajaInactivaError);
    });
    it('no lanza si hay sesión activa', () => {
      expect(() => validarSesionActivaParaVenta(5, 42)).not.toThrow();
    });
  });

  describe('BR-VEN-002 validarCarritoNoVacio', () => {
    it('lanza CarritoVacioError si el carrito tiene 0 ítems', () => {
      expect(() => validarCarritoNoVacio(0)).toThrow(CarritoVacioError);
    });
    it('no lanza si hay al menos 1 ítem', () => {
      expect(() => validarCarritoNoVacio(1)).not.toThrow();
    });
  });

  describe('BR-VEN-003 validarVentaActiva', () => {
    it('lanza VentaYaAnuladaError si la venta está anulada', () => {
      expect(() => validarVentaActiva(1, 'anulada')).toThrow(VentaYaAnuladaError);
    });
    it('no lanza si la venta está activa', () => {
      expect(() => validarVentaActiva(1, 'activa')).not.toThrow();
    });
  });

  describe('BR-VEN-004 validarVentaEnSesion', () => {
    it('lanza VentaDeOtroTurnoError si la sesión no coincide', () => {
      expect(() => validarVentaEnSesion(1, 10, 20)).toThrow(VentaDeOtroTurnoError);
    });
    it('no lanza si la sesión coincide', () => {
      expect(() => validarVentaEnSesion(1, 10, 10)).not.toThrow();
    });
  });

  describe('BR-VEN-005 calcularSubtotalDetalle', () => {
    it('calcula correctamente precio × cantidad − descuento', () => {
      expect(calcularSubtotalDetalle(5000, 2, 1000)).toBe(9000);
    });
    it('no permite subtotal negativo', () => {
      expect(calcularSubtotalDetalle(100, 1, 500)).toBe(0);
    });
    it('sin descuento devuelve precio × cantidad', () => {
      expect(calcularSubtotalDetalle(3000, 3, 0)).toBe(9000);
    });
  });

  describe('BR-VEN-007 validarEfectivoSuficiente', () => {
    it('lanza EfectivoInsuficienteError si el efectivo no cubre el total', () => {
      expect(() => validarEfectivoSuficiente(9000, 10000)).toThrow(EfectivoInsuficienteError);
    });
    it('no lanza si el efectivo es igual al total (pago exacto)', () => {
      expect(() => validarEfectivoSuficiente(10000, 10000)).not.toThrow();
    });
    it('no lanza si el efectivo supera el total (hay cambio)', () => {
      expect(() => validarEfectivoSuficiente(20000, 10000)).not.toThrow();
    });
  });

  describe('BR-VEN-006 calcularTotalesCarrito', () => {
    it('suma correctamente subtotal, descuento, iva y total', () => {
      const items = [
        { precioUnitario: 10000, cantidad: 2, descuento: 0,    porcentajeTax: 0  },
        { precioUnitario:  5000, cantidad: 1, descuento: 500,  porcentajeTax: 19 },
      ];
      const t = calcularTotalesCarrito(items);
      // Precios son IVA-incluido. IVA se extrae: bruto * t / (100 + t)
      // item2: iva = 5000 * 19 / 119 = 798.32 → 798
      // subtotal = (20000 - 0) + (5000 - 798.32) = 24202
      // total = subtotal + iva - descuento = 24202 + 798 - 500 = 24500
      expect(t.subtotal).toBe(24202);
      expect(t.descuento).toBe(500);
      expect(t.iva).toBe(798);
      expect(t.total).toBe(24500);
    });
    it('carrito vacío retorna todos en 0', () => {
      const t = calcularTotalesCarrito([]);
      expect(t.subtotal).toBe(0);
      expect(t.total).toBe(0);
    });
    it('productos sin IVA no generan iva', () => {
      const t = calcularTotalesCarrito([{ precioUnitario: 5000, cantidad: 2, descuento: 0, porcentajeTax: 0 }]);
      expect(t.iva).toBe(0);
      expect(t.total).toBe(10000);
    });
  });
});
