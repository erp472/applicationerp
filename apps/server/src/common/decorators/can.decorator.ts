import { SetMetadata } from '@nestjs/common';

/**
 * Regla de negocio: "¿este usuario puede hacer esto?" — autorización pura,
 * nada que ver con si el módulo está encendido (eso es @Feature, ver
 * common/decorators/feature.decorator.ts y common/guards/feature-flag.guard.ts).
 */
export interface CanOpciones {
  /** Verifica que el rol del JWT coincida exactamente (sin BD, ya viene en el token) */
  rol?: string;
  /** Verifica que el usuario tenga el permiso en su JWT (payload.permisos, calculado en el login) */
  permiso?: string;
}

export const CAN_KEY = 'can_opciones';

/**
 * Ejemplos de uso:
 *   @Can({ rol: 'ADMIN_SISTEMA' })
 *   @Can({ permiso: 'facturacion:crear' })
 *   @Can({ rol: 'ADMIN_SISTEMA', permiso: 'facturacion:crear' })  → OR: cualquiera de las dos basta
 *
 * Se puede combinar con @Feature('modulo_x') apilando ambos guards — son dos
 * reglas de negocio independientes:
 *   @UseGuards(JwtAuthGuard, FeatureFlagGuard, CanGuard)
 *   @Feature('modulo_facturacion')
 *   @Can({ permiso: 'facturacion:crear' })
 */
export const Can = (opciones: CanOpciones) => SetMetadata(CAN_KEY, opciones);
