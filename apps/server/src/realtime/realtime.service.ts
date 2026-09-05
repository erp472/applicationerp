import { Injectable } from '@nestjs/common';
import type { WebSocket } from '@fastify/websocket';

export type RealtimeEvent =
  | 'cajas.status'
  | 'cajas.sesion.abierta'
  | 'cajas.sesion.cerrada'
  | 'cajas.movimiento'
  | 'cajas.consignacion'
  | 'cajas.custodia'
  | 'cajas.servicios'
  | 'tesoreria.movimiento'
  | 'ventas.venta_confirmada'
  | 'inventario.stock_bajo'
  | 'heartbeat'
  | 'security.alert'
  | 'security.anomaly'
  | 'audit.event';

export interface RealtimeMessage {
  event: RealtimeEvent;
  data:  unknown;
}

export const ROL_AUDITORIA = 'ADMIN_SISTEMA';

@Injectable()
export class RealtimeService {
  /** El rol se guarda por socket para poder restringir los eventos que no todos
   *  los conectados deben ver, como la auditoría. */
  private readonly clients = new Map<WebSocket, string | undefined>();

  addClient(ws: WebSocket, rol?: string): void {
    this.clients.set(ws, rol);
    ws.on('close', () => this.clients.delete(ws));
  }

  broadcast(event: RealtimeEvent, data: unknown = {}): void {
    this.enviar([...this.clients.keys()], event, data);
  }

  /** Emite solo a los sockets cuyo rol esté en `roles`. */
  broadcastToRoles(roles: readonly string[], event: RealtimeEvent, data: unknown = {}): void {
    const destinatarios = [...this.clients.entries()]
      .filter(([, rol]) => rol !== undefined && roles.includes(rol))
      .map(([ws]) => ws);
    this.enviar(destinatarios, event, data);
  }

  private enviar(sockets: WebSocket[], event: RealtimeEvent, data: unknown): void {
    if (sockets.length === 0) return;
    const msg = JSON.stringify({ event, data });
    for (const ws of sockets) {
      if (ws.readyState === ws.OPEN) ws.send(msg);
    }
  }

  get connectionCount(): number {
    return this.clients.size;
  }
}
