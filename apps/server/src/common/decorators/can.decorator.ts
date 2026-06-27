import { SetMetadata } from '@nestjs/common';

export interface CanOpciones {
  /** Verifica que el rol del JWT coincida exactamente */
  rol?: string;
  /** Verifica que el usuario tenga el permiso en la tabla roles_permisos */
  permiso?: string;
}

export const CAN_KEY = 'can_opciones';

/**
 * Protege una ruta con lógica OR:
 *   @Can({ rol: 'ADMIN_SISTEMA' })           → solo ese rol
 *   @Can({ permiso: 'modo_pos' })             → quien tenga ese permiso
 *   @Can({ rol: 'ADMIN_SISTEMA', permiso: 'x' }) → tiene el rol O el permiso
 */
export const Can = (opciones: CanOpciones) => SetMetadata(CAN_KEY, opciones);
