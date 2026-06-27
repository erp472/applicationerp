import { SetMetadata } from '@nestjs/common';

export interface CanOpciones {
  /** Verifica que el rol del JWT coincida exactamente (sin BD) */
  rol?: string;
  /** Verifica que el usuario tenga el permiso en roles_permisos (BD) */
  permiso?: string;
  /**
   * Puerta global AND: si el feature flag no está PRODUCCION o AB_TEST,
   * bloquea a todos independientemente de rol o permiso.
   */
  feature?: string;
}

export const CAN_KEY = 'can_opciones';

/**
 * Ejemplos de uso:
 *   @Can({ rol: 'ADMIN_SISTEMA' })
 *   @Can({ permiso: 'modo_pos' })
 *   @Can({ feature: 'modulo_pos', permiso: 'modo_pos' })
 *   @Can({ feature: 'facturacion', rol: 'ADMIN_SISTEMA', permiso: 'facturacion' })
 */
export const Can = (opciones: CanOpciones) => SetMetadata(CAN_KEY, opciones);
